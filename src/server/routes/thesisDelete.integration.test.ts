import { describe, it, expect, beforeEach, vi } from 'vitest'
import supertest from 'supertest'
import fs from 'fs'

import {
  Attachment,
  Author,
  EventLog,
  Program,
  Supervision,
  Thesis,
  User,
} from '../db/models'

const app = (await import('../index')).default
const request = supertest.agent(app)

const PROGRAM_ID = 'thesis-delete-program'

const user = (uid: string, id: string, student = false) => ({
  uid,
  hypersonsisuid: id,
  hygroupcn: student ? 'hy-ktdk-students' : 'hy-employees',
})
const headers = {
  author: user('author1', 'hy-hlo-author-1', true),
  otherStudent: user('student2', 'hy-hlo-student-2', true),
  otherEmployee: user('employee1', 'hy-hlo-employee-1'),
}

describe('deleting a thesis', () => {
  let thesis: Thesis
  let mockUnlinkSync: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    mockUnlinkSync = vi.fn()
    fs.unlinkSync = mockUnlinkSync as unknown as typeof fs.unlinkSync

    await Program.create({
      id: PROGRAM_ID,
      name: { fi: 'Ohjelma', en: 'Program', sv: 'Program' },
      options: { allowStudentStartedProcess: true },
      level: 'master',
      international: true,
      enabled: true,
    })

    await User.bulkCreate([
      ...Object.values(headers).map(({ uid, hypersonsisuid, hygroupcn }) => ({
        id: hypersonsisuid,
        username: uid,
        firstName: uid,
        lastName: 'Test',
        email: `${uid}@test.fi`,
        language: 'fi',
        hasStudyRight: hygroupcn === 'hy-ktdk-students',
      })),
      {
        id: 'hy-hlo-supervisor-1',
        username: 'supervisor1',
        firstName: 'supervisor1',
        lastName: 'Test',
        email: 'supervisor1@test.fi',
        language: 'fi',
      },
    ])

    thesis = await Thesis.create({
      programId: PROGRAM_ID,
      topic: 'Thesis that must survive',
      status: 'IN_PROGRESS',
      startDate: '2024-01-01',
      targetDate: '2070-01-01',
    })

    await Author.create({ userId: 'hy-hlo-author-1', thesisId: thesis.id })
    await Supervision.create({
      userId: 'hy-hlo-supervisor-1',
      thesisId: thesis.id,
      percentage: 100,
      isPrimarySupervisor: true,
    })
    await Attachment.create({
      thesisId: thesis.id,
      label: 'researchPlan',
      filename: 'research-plan-file',
      originalname: 'plan.pdf',
      mimetype: 'application/pdf',
    })
  })

  const expectThesisUntouched = async () => {
    // The response is sent before a handler that forgot to return finishes,
    // so give it time to run before checking the database
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(await Thesis.findByPk(thesis.id)).not.toBeNull()
    expect(await Attachment.count({ where: { thesisId: thesis.id } })).toEqual(
      1
    )
    expect(mockUnlinkSync).not.toHaveBeenCalled()
    expect(await EventLog.count({ where: { type: 'THESIS_DELETED' } })).toEqual(
      0
    )
  }

  it('does not let an employee without access delete the files', async () => {
    const response = await request
      .delete(`/api/theses/${thesis.id}`)
      .set(headers.otherEmployee)

    expect(response.status).toEqual(404)
    await expectThesisUntouched()
  })

  it('does not let a student delete a thesis they did not author', async () => {
    await thesis.update({ status: 'DRAFT' })

    const response = await request
      .delete(`/api/student/theses/${thesis.id}`)
      .set(headers.otherStudent)

    expect(response.status).toEqual(401)
    await expectThesisUntouched()
  })

  it('does not let the author delete a thesis that is no longer a draft', async () => {
    const response = await request
      .delete(`/api/student/theses/${thesis.id}`)
      .set(headers.author)

    expect(response.status).toEqual(401)
    await expectThesisUntouched()
  })

  it('deletes the thesis even if its file is already missing from disk', async () => {
    mockUnlinkSync.mockImplementation(() => {
      throw Object.assign(new Error('no such file'), { code: 'ENOENT' })
    })
    await thesis.update({ status: 'DRAFT' })

    const response = await request
      .delete(`/api/student/theses/${thesis.id}`)
      .set(headers.author)

    expect(response.status).toEqual(204)
    expect(await Thesis.findByPk(thesis.id)).toBeNull()
    expect(await Attachment.count({ where: { thesisId: thesis.id } })).toEqual(
      0
    )
  })

  it('returns 404 for a student when the thesis does not exist', async () => {
    const response = await request
      .delete('/api/student/theses/does-not-exist')
      .set(headers.author)

    expect(response.status).toEqual(404)
    await expectThesisUntouched()
  })
})
