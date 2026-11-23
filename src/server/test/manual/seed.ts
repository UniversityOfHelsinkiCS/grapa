import fs from 'node:fs/promises'

import { sequelize } from '../../db/connection'
import { DEMO_DATA_ENABLED } from '../../util/config'
import {
  Approver,
  Attachment,
  Author,
  Department,
  EventLog,
  Grader,
  Program,
  ProgramManagement,
  StudyTrack,
  StudyRight,
  StudyTrackManagement,
  Supervision,
  Thesis,
  User,
} from '../../db/models'
import {
  BACHELOR_PROGRAM,
  CO_MANAGER,
  DEPARTMENT,
  type Language,
  MANAGER,
  MASTER_PROGRAM,
  MILESTONES,
  NOW,
  STUDY_RIGHTS,
  STUDY_TRACKS,
  TARGET_DATES,
  THESES,
  TRACK_MANAGER,
  USERS,
} from './demoData'

// Every table but the migrations, with or without a model
export const truncateAll = async () => {
  if (!DEMO_DATA_ENABLED)
    throw new Error('Refusing to wipe the database outside the e2e build')
  const [rows] = await sequelize.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'SequelizeMeta'`
  )
  const tables = (rows as { tablename: string }[]).map(
    ({ tablename }) => `"${tablename}"`
  )
  if (tables.length === 0) return
  await sequelize.query(
    `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`
  )
}

const monthsBeforeNow = (months: number) => {
  const date = new Date(NOW)
  date.setMonth(date.getMonth() - months)
  return date
}

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10)

// Where the app keeps the uploaded files, see src/server/middleware/attachment.ts
const UPLOADS = '/opt/app-root/src/uploads/'
const DEMO_PDF =
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'

// The app requires a topic description whenever a thesis is saved
const createResearchPlan = async (thesisId: string, index: number) => {
  const filename = `manual-research-plan-${index}`
  await fs.mkdir(UPLOADS, { recursive: true })
  await fs.writeFile(`${UPLOADS}${filename}`, DEMO_PDF)
  await Attachment.create({
    thesisId,
    filename,
    originalname: 'aihekuvaus.pdf',
    mimetype: 'application/pdf',
    label: 'researchPlan',
  } as any)
}

// Replaces all data, thesis topics in the video's language
export const seedManual = async (lang: Language) => {
  await truncateAll()

  await Department.create(DEPARTMENT)

  await User.bulkCreate(
    USERS.map((user) => ({
      ...user,
      language: lang,
      departmentId: user.employeeNumber ? DEPARTMENT.id : null,
      hasStudyRight: Boolean(user.studentNumber),
    }))
  )

  await Program.create({
    ...MASTER_PROGRAM,
    level: 'master',
    international: false,
    companionFaculties: [],
    enabled: true,
    options: {
      useMilestones: true,
      milestones: {
        versions: [MILESTONES.map((milestone) => ({ value: milestone }))],
      },
      targetDates: TARGET_DATES.map((value) => ({ value })),
    },
  })
  await Program.create({
    ...BACHELOR_PROGRAM,
    level: 'bachelor',
    international: false,
    companionFaculties: [],
    enabled: true,
    options: { isBachelorProgram: true, numberOfGraders: 1 },
  })

  await StudyTrack.bulkCreate(
    STUDY_TRACKS.map((track) => ({
      ...track,
      // Study rights refer to the track by its Sisu id
      sisuId: track.id,
      programId: MASTER_PROGRAM.id,
    }))
  )

  await ProgramManagement.bulkCreate([
    {
      programId: MASTER_PROGRAM.id,
      userId: MANAGER.id,
      isThesisApprover: true,
    },
    {
      programId: BACHELOR_PROGRAM.id,
      userId: MANAGER.id,
      isThesisApprover: true,
    },
    {
      programId: MASTER_PROGRAM.id,
      userId: CO_MANAGER.id,
      isThesisApprover: false,
    },
  ])
  await StudyTrackManagement.create({
    studyTrackId: STUDY_TRACKS[2].id,
    userId: TRACK_MANAGER.id,
  })

  await StudyRight.bulkCreate(
    STUDY_RIGHTS.map(({ user, studyTrack }) => ({
      userId: user.id,
      programId: MASTER_PROGRAM.id,
      programCode: MASTER_PROGRAM.id,
      studyTrackId: STUDY_TRACKS[studyTrack].id,
      studyTrackCode: STUDY_TRACKS[studyTrack].code,
      startDate: toDateOnly(monthsBeforeNow(12)),
    })) as any[]
  )

  // One at a time, so the theses are listed in this order
  for (const [index, demoThesis] of THESES.entries()) {
    const startedAt = monthsBeforeNow(demoThesis.startedMonthsAgo)
    const thesis = await Thesis.create({
      programId: MASTER_PROGRAM.id,
      studyTrackId: STUDY_TRACKS[demoThesis.studyTrack].id,
      topic: demoThesis.topic[lang],
      status: demoThesis.status,
      startDate: toDateOnly(startedAt),
      targetDate: TARGET_DATES[0],
      milestone: demoThesis.milestone,
      milestoneVersion: 0,
      isIdle: demoThesis.isIdle ?? false,
    } as any)
    await createResearchPlan(thesis.id, index)
    await Supervision.create({
      thesisId: thesis.id,
      userId: demoThesis.supervisor.id,
      percentage: 100,
      isPrimarySupervisor: true,
    })
    await Grader.bulkCreate([
      {
        thesisId: thesis.id,
        userId: demoThesis.supervisor.id,
        isPrimaryGrader: true,
      },
      ...(demoThesis.secondGrader
        ? [
            {
              thesisId: thesis.id,
              userId: demoThesis.secondGrader.id,
              isPrimaryGrader: false,
            },
          ]
        : []),
    ] as any[])
    if (demoThesis.approver)
      await Approver.create({
        thesisId: thesis.id,
        userId: demoThesis.approver.id,
      } as any)
    await Author.create({
      thesisId: thesis.id,
      userId: demoThesis.student.id,
    })
    await EventLog.create({
      thesisId: thesis.id,
      userId: demoThesis.supervisor.id,
      type: 'THESIS_CREATED',
      createdAt: startedAt,
    } as any)
    if (demoThesis.status !== 'PLANNING') {
      await EventLog.create({
        thesisId: thesis.id,
        userId: demoThesis.supervisor.id,
        type: 'THESIS_STATUS_CHANGED',
        data: { from: 'PLANNING', to: demoThesis.status },
        createdAt: monthsBeforeNow(demoThesis.startedMonthsAgo - 1),
      } as any)
    }
  }

  return {
    managerId: MANAGER.id,
    masterProgramId: MASTER_PROGRAM.id,
    bachelorProgramId: BACHELOR_PROGRAM.id,
  }
}
