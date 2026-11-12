import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import app from '../index'
import { MAX_MILESTONE_ATTACHMENTS, MAX_UPLOAD_SIZE_BYTES } from '../../config'
import {
  Attachment,
  Author,
  EthesisAdmin,
  Grader,
  Program,
  ProgramManagement,
  SeminarSupervision,
  StudyRight,
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
  ethesisAdmin: user('ethesis1', 'hy-hlo-ethesis-1'),
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
      .post(path(role))
      .set(headers[role])
      .attach('milestoneFile', ...pdf(name))

  const getMilestoneAttachments = () =>
    Attachment.findAll({
      where: { thesisId: thesis.id, label: 'milestone' },
      order: [
        ['milestone', 'ASC'],
        ['createdAt', 'ASC'],
      ],
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
    await EthesisAdmin.create({
      programId: PROGRAM_ID,
      userId: 'hy-hlo-ethesis-1',
    })
  })

  describe('uploading', () => {
    it.each<Role>([
      'student',
      'supervisor',
      'seminarSupervisor',
      'programManager',
      'ethesisAdmin',
      'admin',
    ])(
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

    it('keeps the existing files of the milestone', async () => {
      await upload('supervisor', 'first.pdf')
      await upload('student', 'second.pdf')

      const attachments = await getMilestoneAttachments()
      expect(attachments.map((a) => a.originalname)).toEqual([
        'first.pdf',
        'second.pdf',
      ])
    })

    it(`allows at most ${MAX_MILESTONE_ATTACHMENTS} files per milestone`, async () => {
      for (let i = 0; i < MAX_MILESTONE_ATTACHMENTS; i++) {
        expect((await upload('student', `file-${i}.pdf`)).status).toEqual(204)
      }

      const response = await upload('supervisor', 'one-too-many.pdf')

      expect(response.status).toEqual(400)
      expect(await getMilestoneAttachments()).toHaveLength(
        MAX_MILESTONE_ATTACHMENTS
      )
    })

    it('does not count files of other milestones towards the limit', async () => {
      await Attachment.bulkCreate(
        Array.from({ length: MAX_MILESTONE_ATTACHMENTS }, (_, i) => ({
          thesisId: thesis.id,
          label: 'milestone',
          milestone: 1,
          filename: `earlier-${i}`,
          originalname: `earlier-${i}.pdf`,
          mimetype: 'application/pdf',
        }))
      )

      expect((await upload('student')).status).toEqual(204)
    })

    it('enforces the limit for concurrent uploads', async () => {
      const responses = await Promise.all(
        Array.from({ length: MAX_MILESTONE_ATTACHMENTS + 2 }, (_, i) =>
          upload('student', `file-${i}.pdf`)
        )
      )

      expect(responses.filter((r) => r.status === 204)).toHaveLength(
        MAX_MILESTONE_ATTACHMENTS
      )
      expect(await getMilestoneAttachments()).toHaveLength(
        MAX_MILESTONE_ATTACHMENTS
      )
    })

    it.each<[Role, number]>([
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
      [
        'the stored milestone is negative',
        () => thesis.update({ milestone: -1 }),
      ],
    ])('rejects uploads when %s', async (_, setup, contentType) => {
      await setup()

      const response = await request
        .post(path('supervisor'))
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
        .post(path('supervisor'))
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
        .post(path('supervisor'))
        .set(headers.supervisor)

      expect(response.status).toEqual(400)
    })

    it('rejects other file fields', async () => {
      const response = await request
        .post(path('supervisor'))
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
      createdAt: expect.any(String),
    }))

    it.each([
      ['student', '/api/student/theses?limit=25&offset=0'],
      ['supervisor', '/api/theses/paginate?limit=25&offset=0'],
    ] as const)(
      'returns the files in the paginated list of the %s',
      async (role, listPath) => {
        const response = await request.get(listPath).set(headers[role])

        expect(response.status).toEqual(200)
        expect(response.body.theses).toHaveLength(1)
        expect(response.body.theses[0].milestoneAttachments).toEqual(
          expectedAttachments
        )
      }
    )

    const removePath = (role: Role, filename: string) =>
      `${path(role)}/${filename}`

    it.each<Role>([
      'student',
      'supervisor',
      'seminarSupervisor',
      'programManager',
      'ethesisAdmin',
      'admin',
    ])(
      'lets the %s remove a file of the milestone being worked on',
      async (role) => {
        await Attachment.create({
          thesisId: thesis.id,
          label: 'milestone',
          milestone: 2,
          filename: 'milestone-file-2b',
          originalname: 'milestone-2b.pdf',
          mimetype: 'application/pdf',
        })

        const response = await request
          .delete(removePath(role, 'milestone-file-2'))
          .set(headers[role])

        expect(response.status).toEqual(204)
        const attachments = await getMilestoneAttachments()
        expect(attachments.map((a) => a.filename)).toEqual([
          'milestone-file-1',
          'milestone-file-2b',
        ])
      }
    )

    it.each([
      ['a file of a done milestone', 'milestone-file-1'],
      ['a research plan', 'research-plan-file'],
      ['a file that does not exist', 'missing-file'],
    ])('does not remove %s', async (_, filename) => {
      const response = await request
        .delete(removePath('student', filename))
        .set(headers.student)

      expect(response.status).toEqual(404)
      expect(await getMilestoneAttachments()).toHaveLength(2)
      expect(
        await Attachment.count({
          where: { thesisId: thesis.id, label: 'researchPlan' },
        })
      ).toEqual(1)
    })

    it.each<Role>([
      'student',
      'supervisor',
      'seminarSupervisor',
      'programManager',
      'ethesisAdmin',
      'admin',
    ])(
      'does not let the %s remove a file of another thesis through this thesis',
      async (role) => {
        // Same program and active milestone, so only the thesis differs
        const otherThesis = await Thesis.create({
          programId: PROGRAM_ID,
          topic: 'Other thesis',
          status: 'IN_PROGRESS',
          milestone: 1,
          milestoneVersion: 0,
          startDate: '2024-01-01',
          targetDate: '2070-01-01',
        })
        await Author.create({
          userId: 'hy-hlo-student-2',
          thesisId: otherThesis.id,
        })
        await Attachment.create({
          thesisId: otherThesis.id,
          label: 'milestone',
          milestone: 2,
          filename: 'other-thesis-file',
          originalname: 'other-thesis.pdf',
          mimetype: 'application/pdf',
        })

        const response = await request
          .delete(removePath(role, 'other-thesis-file'))
          .set(headers[role])

        expect(response.status).toEqual(404)
        expect(
          await Attachment.findOne({ where: { filename: 'other-thesis-file' } })
        ).not.toBeNull()
        expect(await getMilestoneAttachments()).toHaveLength(2)
      }
    )

    it('rejects removal by students who are not authors', async () => {
      const response = await request
        .delete(removePath('otherStudent', 'milestone-file-2'))
        .set(headers.otherStudent)

      expect(response.status).toEqual(401)
      expect(await getMilestoneAttachments()).toHaveLength(2)
    })

    it('rejects removal by employees without access to the thesis', async () => {
      const response = await request
        .delete(removePath('otherEmployee', 'milestone-file-2'))
        .set(headers.otherEmployee)

      expect(response.status).toEqual(404)
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

  describe('changing the milestone', () => {
    const setMilestone = async (
      role: 'student' | 'supervisor',
      milestone: unknown
    ) => {
      const basePath =
        role === 'student' ? '/api/student/theses' : '/api/theses'
      const { body: original } = await request
        .get(`${basePath}/${thesis.id}`)
        .set(headers[role])

      return request
        .put(`${basePath}/${thesis.id}`)
        .set(headers[role])
        .field('json', JSON.stringify({ ...original, milestone }))
    }

    beforeEach(async () => {
      await Grader.create({
        userId: 'hy-hlo-supervisor-1',
        thesisId: thesis.id,
        isPrimaryGrader: true,
      })
      await Attachment.create({
        thesisId: thesis.id,
        label: 'researchPlan',
        filename: 'research-plan-file',
        originalname: 'research-plan.pdf',
        mimetype: 'application/pdf',
      })
    })

    it.each<['student' | 'supervisor', unknown]>([
      ['student', -1],
      ['student', 4],
      ['student', 1.5],
      ['supervisor', -1],
      ['supervisor', 4],
      ['supervisor', 1.5],
    ])('rejects the %s setting the milestone to %s', async (role, value) => {
      const response = await setMilestone(role, value)

      expect(response.status).toEqual(400)
      expect(response.body.error).toEqual('Milestone is out of range')
      expect((await thesis.reload()).milestone).toEqual(1)
    })

    it.each<['student' | 'supervisor', number]>([
      ['student', 0],
      ['student', 3],
      ['supervisor', 0],
      ['supervisor', 3],
    ])('lets the %s set the milestone to %i', async (role, value) => {
      const response = await setMilestone(role, value)

      expect(response.status).toEqual(200)
      expect((await thesis.reload()).milestone).toEqual(value)
    })
  })
  it('validates the milestone against the stored version when none is sent', async () => {
    await Grader.create({
      userId: 'hy-hlo-supervisor-1',
      thesisId: thesis.id,
      isPrimaryGrader: true,
    })
    await Attachment.create({
      thesisId: thesis.id,
      label: 'researchPlan',
      filename: 'research-plan-file',
      originalname: 'research-plan.pdf',
      mimetype: 'application/pdf',
    })
    const { body: original } = await request
      .get(`/api/theses/${thesis.id}`)
      .set(headers.supervisor)
    delete original.milestoneVersion

    const response = await request
      .put(`/api/theses/${thesis.id}`)
      .set(headers.supervisor)
      .field('json', JSON.stringify({ ...original, milestone: 3 }))

    expect(response.status).toEqual(200)
    expect((await thesis.reload()).milestone).toEqual(3)
  })

  describe('student updates outside drafts', () => {
    const studentPath = () => `/api/student/theses/${thesis.id}`

    const getStudentThesis = async () =>
      (await request.get(studentPath()).set(headers.student)).body

    const getResearchPlan = () =>
      Attachment.findOne({
        where: { thesisId: thesis.id, label: 'researchPlan' },
      })

    beforeEach(async () => {
      await Grader.create({
        userId: 'hy-hlo-supervisor-1',
        thesisId: thesis.id,
        isPrimaryGrader: true,
      })
      await Attachment.create({
        thesisId: thesis.id,
        label: 'researchPlan',
        filename: 'research-plan-file',
        originalname: 'research-plan.pdf',
        mimetype: 'application/pdf',
      })
      await thesis.update({ isIdle: true })
    })

    it.each([
      ['milestone', { milestone: 2 }],
      ['idle', { isIdle: false }],
      ['topic', { topic: 'New topic' }],
    ])(
      'does not replace the research plan in a %s update',
      async (_, change) => {
        const original = await getStudentThesis()

        const response = await request
          .put(studentPath())
          .set(headers.student)
          .field('json', JSON.stringify({ ...original, ...change }))
          .attach('researchPlan', ...pdf('new-plan.pdf'))

        expect(response.status).toEqual(200)
        expect(response.body).toMatchObject(change)
        expect((await getResearchPlan())?.originalname).toEqual(
          'research-plan.pdf'
        )
      }
    )

    it('does not remove the ways of working file when its data is missing', async () => {
      await Attachment.create({
        thesisId: thesis.id,
        label: 'waysOfWorking',
        filename: 'ways-of-working-file',
        originalname: 'ways-of-working.pdf',
        mimetype: 'application/pdf',
      })
      const original = await getStudentThesis()

      const response = await request
        .put(studentPath())
        .set(headers.student)
        .field(
          'json',
          JSON.stringify({ ...original, milestone: 2, waysOfWorking: null })
        )

      expect(response.status).toEqual(200)
      expect(response.body.milestone).toEqual(2)
      expect(
        await Attachment.findOne({
          where: { thesisId: thesis.id, label: 'waysOfWorking' },
        })
      ).not.toBeNull()
    })

    it('still lets students replace the research plan of a draft', async () => {
      await thesis.update({ status: 'DRAFT', isIdle: false })
      await StudyRight.create({
        userId: 'hy-hlo-student-1',
        programId: PROGRAM_ID,
        programCode: PROGRAM_ID,
      })
      const original = await getStudentThesis()

      const response = await request
        .put(studentPath())
        .set(headers.student)
        .field('json', JSON.stringify(original))
        .attach('researchPlan', ...pdf('new-plan.pdf'))

      expect(response.status).toEqual(200)
      expect((await getResearchPlan())?.originalname).toEqual('new-plan.pdf')
    })
  })
})
