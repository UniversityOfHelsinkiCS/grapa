import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import supertest from 'supertest'
import fs from 'fs'
import { Readable } from 'stream'
import app from '../index'
import {
  Attachment,
  Author,
  EthesisAdmin,
  Program,
  ProgramManagement,
  SeminarSupervision,
  Supervision,
  Thesis,
  User,
} from '../db/models'

const request = supertest.agent(app)

const PROGRAM_ID = 'attachment-download-program'
const FILE_CONTENT = '%PDF-1.4 download test'

const user = (uid: string, id: string, hygroupcn = 'hy-employees') => ({
  uid,
  hypersonsisuid: id,
  hygroupcn,
})
const headers = {
  supervisor: user('supervisor1', 'hy-hlo-supervisor-1'),
  seminarSupervisor: user('seminar1', 'hy-hlo-seminar-1'),
  programManager: user('manager1', 'hy-hlo-manager-1'),
  ethesisAdmin: user('ethesis1', 'hy-hlo-ethesis-1'),
  admin: user('admin1', 'hy-hlo-admin-1', 'grp-toska'),
  otherEmployee: user('employee1', 'hy-hlo-employee-1'),
  author: user('student1', 'hy-hlo-student-1', 'hy-ktdk-students'),
}
type Role = keyof typeof headers

const roles = Object.keys(headers) as Role[]

describe('GET /api/attachments/:filename', () => {
  let thesis: Thesis

  const download = (role: Role, filename = 'research-plan-file') =>
    request.get(`/api/attachments/${filename}`).set(headers[role])

  beforeEach(async () => {
    vi.spyOn(fs, 'statSync').mockReturnValue({
      size: FILE_CONTENT.length,
    } as fs.Stats)
    vi.spyOn(fs, 'createReadStream').mockImplementation(
      () => Readable.from([Buffer.from(FILE_CONTENT)]) as fs.ReadStream
    )

    await Program.create({
      id: PROGRAM_ID,
      name: { fi: 'Liiteohjelma', en: 'Attachment program', sv: 'Program' },
      level: 'master',
      international: true,
      enabled: true,
    })

    await User.bulkCreate(
      Object.values(headers).map(({ uid, hypersonsisuid, hygroupcn }) => ({
        id: hypersonsisuid,
        username: uid,
        firstName: uid,
        lastName: 'Test',
        email: `${uid}@test.fi`,
        language: 'fi',
        hasStudyRight: hygroupcn === 'hy-ktdk-students',
      }))
    )

    thesis = await Thesis.create({
      programId: PROGRAM_ID,
      topic: 'Attachment thesis',
      status: 'IN_PROGRESS',
      startDate: '2024-01-01',
      targetDate: '2070-01-01',
    })

    await Author.create({ userId: 'hy-hlo-student-1', thesisId: thesis.id })
    await Supervision.create({
      userId: 'hy-hlo-supervisor-1',
      thesisId: thesis.id,
      percentage: 100,
      isPrimarySupervisor: true,
    })
    await SeminarSupervision.create({
      userId: 'hy-hlo-seminar-1',
      thesisId: thesis.id,
    })
    await ProgramManagement.create({
      programId: PROGRAM_ID,
      userId: 'hy-hlo-manager-1',
    })
    await EthesisAdmin.create({ userId: 'hy-hlo-ethesis-1' })
    await Attachment.create({
      thesisId: thesis.id,
      label: 'researchPlan',
      filename: 'research-plan-file',
      originalname: 'research-plan.pdf',
      mimetype: 'application/pdf',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each<Role>([
    'supervisor',
    'seminarSupervisor',
    'programManager',
    'ethesisAdmin',
    'admin',
  ])('lets the %s download the file', async (role) => {
    const response = await download(role).buffer(true)

    expect(response.status).toEqual(200)
    expect(response.headers['content-disposition']).toEqual(
      'attachment; filename=research-plan.pdf'
    )
    expect(response.body.toString()).toEqual(FILE_CONTENT)
  })

  it('returns 404 to employees without access to the thesis', async () => {
    const response = await download('otherEmployee')

    expect(response.status).toEqual(404)
    expect(fs.createReadStream).not.toHaveBeenCalled()
  })

  it('returns 404 for unknown files', async () => {
    expect((await download('admin', 'unknown-file')).status).toEqual(404)
  })

  it.each<Role>(roles.filter((role) => role !== 'author'))(
    'gives the %s the same access as opening the thesis',
    async (role) => {
      const thesisResponse = await request
        .get(`/api/theses/${thesis.id}`)
        .set(headers[role])
      const downloadResponse = await download(role)

      expect(thesisResponse.status === 200).toEqual(
        downloadResponse.status === 200
      )
    }
  )

  it('keeps students on the student download route', async () => {
    expect((await download('author')).status).toEqual(401)

    const response = await request
      .get('/api/student/attachments/research-plan-file')
      .set(headers.author)
    expect(response.status).toEqual(200)
  })
})
