import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import app from '../index'
import { MAX_UPLOAD_SIZE_BYTES } from '../../config'
import {
  Attachment,
  Author,
  Grader,
  Program,
  ProgramManagement,
  SeminarSupervision,
  Supervision,
  Thesis,
  User,
} from '../db/models'

const request = supertest.agent(app)

const PROGRAM_ID = 'milestone-file-program'

const user = (uid: string, id: string, student = false) => ({
  uid,
  hypersonsisuid: id,
  hygroupcn: student ? 'hy-ktdk-students' : 'hy-employees',
})
const headers = {
  student: user('student1', 'hy-hlo-student-1', true),
  otherStudent: user('student2', 'hy-hlo-student-2', true),
  supervisor: user('supervisor1', 'hy-hlo-supervisor-1'),
  seminarSupervisor: user('seminar1', 'hy-hlo-seminar-1'),
  programManager: user('manager1', 'hy-hlo-manager-1'),
  otherEmployee: user('employee1', 'hy-hlo-employee-1'),
  admin: { ...user('admin1', 'hy-hlo-admin-1'), hygroupcn: 'grp-toska' },
}
type Role = keyof typeof headers

const pdf = (name = 'plan.pdf') =>
  [
    Buffer.from('%PDF-1.4 test'),
    { filename: name, contentType: 'application/pdf' },
  ] as const

describe('milestone attachments', () => {
  let thesis: Thesis

  const path = (role: Role) =>
    `/api/${role.toLowerCase().includes('student') ? 'student/' : ''}theses/${thesis.id}/milestone-attachment`

  const upload = (role: Role, name?: string) =>
    request
      .put(path(role))
      .set(headers[role])
      .attach('milestoneFile', ...pdf(name))

  const getMilestoneAttachments = () =>
    Attachment.findAll({
      where: { thesisId: thesis.id, label: 'milestone' },
      order: [['milestone', 'ASC']],
    })

  beforeEach(async () => {
    await Program.create({
      id: PROGRAM_ID,
      name: { fi: 'Etappiohjelma', en: 'Milestone program', sv: 'Program' },
      options: {
        allowStudentStartedProcess: true,
        useMilestones: true,
        allowMilestoneAttachments: true,
        milestones: { versions: [['First', 'Second', 'Third']] },
      },
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
      topic: 'Milestone thesis',
      status: 'IN_PROGRESS',
      milestone: 1,
      milestoneVersion: 0,
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
  })

  describe('uploading', () => {
    it.each<Role>(['student', 'supervisor', 'seminarSupervisor', 'admin'])(
      'lets the %s upload a file to the milestone being worked on',
      async (role) => {
        const response = await upload(role)

        expect(response.status).toEqual(204)
        const attachments = await getMilestoneAttachments()
        expect(attachments).toHaveLength(1)
        expect(attachments[0]).toMatchObject({
          milestone: 2,
          originalname: 'plan.pdf',
          mimetype: 'application/pdf',
        })
      }
    )

    it('uploads to the first milestone when no milestone is done yet', async () => {
      await thesis.update({ milestone: 0 })

      expect((await upload('supervisor')).status).toEqual(204)
      expect((await getMilestoneAttachments())[0].milestone).toEqual(1)
    })

    it('replaces the existing file of the milestone', async () => {
      await upload('supervisor', 'first.pdf')
      await upload('student', 'second.pdf')

      const attachments = await getMilestoneAttachments()
      expect(attachments).toHaveLength(1)
      expect(attachments[0].originalname).toEqual('second.pdf')
    })

    it.each<[Role, number]>([
      ['programManager', 403],
      ['otherEmployee', 404],
      ['otherStudent', 401],
    ])('rejects the %s with %i', async (role, status) => {
      expect((await upload(role)).status).toEqual(status)
      expect(await getMilestoneAttachments()).toHaveLength(0)
    })

    it.each<[string, () => Promise<unknown>, string?]>([
      ['the file is not a PDF', async () => {}, 'text/plain'],
      [
        'the program option is disabled',
        async () => {
          const program = await Program.findByPk(PROGRAM_ID)
          await program.update({
            options: { ...program.options, allowMilestoneAttachments: false },
          })
        },
      ],
      [
        'the thesis is not in progress',
        () => thesis.update({ status: 'PLANNING' }),
      ],
      ['all milestones are done', () => thesis.update({ milestone: 3 })],
    ])('rejects uploads when %s', async (_, setup, contentType) => {
      await setup()

      const response = await request
        .put(path('supervisor'))
        .set(headers.supervisor)
        .attach('milestoneFile', Buffer.from('content'), {
          filename: 'file',
          contentType: contentType ?? 'application/pdf',
        })

      expect(response.status).toEqual(400)
      expect(await getMilestoneAttachments()).toHaveLength(0)
    })

    it('rejects files larger than the upload limit with 413', async () => {
      const response = await request
        .put(path('supervisor'))
        .set(headers.supervisor)
        .attach('milestoneFile', Buffer.alloc(MAX_UPLOAD_SIZE_BYTES + 1), {
          filename: 'large.pdf',
          contentType: 'application/pdf',
        })

      expect(response.status).toEqual(413)
      expect(await getMilestoneAttachments()).toHaveLength(0)
    })

    it('rejects requests without a file', async () => {
      const response = await request
        .put(path('supervisor'))
        .set(headers.supervisor)

      expect(response.status).toEqual(400)
    })

    it('rejects other file fields', async () => {
      const response = await request
        .put(path('supervisor'))
        .set(headers.supervisor)
        .attach('researchPlan', ...pdf())

      expect(response.status).toEqual(400)
      expect(await getMilestoneAttachments()).toHaveLength(0)
    })
  })

  describe('with existing milestone files', () => {
    beforeEach(async () => {
      await Grader.create({
        userId: 'hy-hlo-supervisor-1',
        thesisId: thesis.id,
        isPrimaryGrader: true,
      })
      await Attachment.bulkCreate([
        {
          thesisId: thesis.id,
          label: 'researchPlan',
          filename: 'research-plan-file',
          originalname: 'research-plan.pdf',
          mimetype: 'application/pdf',
        },
        ...[1, 2].map((milestone) => ({
          thesisId: thesis.id,
          label: 'milestone',
          milestone,
          filename: `milestone-file-${milestone}`,
          originalname: `milestone-${milestone}.pdf`,
          mimetype: 'application/pdf',
        })),
      ])
    })

    const expectedAttachments = [1, 2].map((milestone) => ({
      milestone,
      filename: `milestone-file-${milestone}`,
      name: `milestone-${milestone}.pdf`,
      mimetype: 'application/pdf',
    }))

    it.each<Role>(['student', 'seminarSupervisor', 'admin'])(
      'lets the %s remove only the file of the milestone being worked on',
      async (role) => {
        const response = await request.delete(path(role)).set(headers[role])

        expect(response.status).toEqual(204)
        const attachments = await getMilestoneAttachments()
        expect(attachments.map((a) => a.milestone)).toEqual([1])
      }
    )

    it('rejects removal by students who are not authors', async () => {
      const response = await request
        .delete(path('otherStudent'))
        .set(headers.otherStudent)

      expect(response.status).toEqual(401)
      expect(await getMilestoneAttachments()).toHaveLength(2)
    })

    it.each([
      ['student', `/api/student/theses`],
      ['supervisor', `/api/theses`],
    ] as const)(
      'returns the files when the %s marks the milestone done',
      async (role, basePath) => {
        const { body: original } = await request
          .get(`${basePath}/${thesis.id}`)
          .set(headers[role])
        expect(original.milestoneAttachments).toEqual(expectedAttachments)

        const response = await request
          .put(`${basePath}/${thesis.id}`)
          .set(headers[role])
          .field('json', JSON.stringify({ ...original, milestone: 2 }))

        expect(response.status).toEqual(200)
        expect(response.body.milestone).toEqual(2)
        expect(response.body.milestoneAttachments).toEqual(expectedAttachments)
      }
    )
  })
})
