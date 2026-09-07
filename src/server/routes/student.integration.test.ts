import { describe, it, expect, beforeEach } from 'vitest'
import supertest from 'supertest'
import app from '../index'
import { Author, Program, StudyTrack, Thesis, User } from '../db/models'

const request = supertest.agent(app)

const studentHeaders = {
  hygroupcn: 'hy-ktdk-students',
  uid: 'student1',
  hypersonsisuid: 'hy-hlo-student-1',
}

const employeeHeaders = {
  hygroupcn: 'hy-employees',
  uid: 'employee1',
  hypersonsisuid: 'hy-hlo-employee-1',
}

const ALLOWED_IN_PROGRESS_TOPIC = 'own in progress thesis in a student program'
const ALLOWED_PLANNING_TOPIC = 'own planning thesis in a student program'
const STAFF_STARTED_TOPIC = 'own thesis in a staff started program'
const OPTED_OUT_TOPIC = 'own thesis in an opted out program'
const OTHER_STUDENTS_TOPIC = 'another students thesis in a student program'

describe('student router', () => {
  beforeEach(async () => {
    await Program.create({
      id: 'student-started-program',
      name: {
        fi: 'Opiskelijan aloittama ohjelma',
        en: 'Student started program',
        sv: 'Studentstartat program',
      },
      options: { allowStudentStartedProcess: true },
      level: 'master',
      international: true,
      enabled: true,
    })
    // Most real programs do not have the option key at all
    await Program.create({
      id: 'staff-started-program',
      name: {
        fi: 'Henkilokunnan aloittama ohjelma',
        en: 'Staff started program',
        sv: 'Personalstartat program',
      },
      level: 'master',
      international: true,
      enabled: true,
    })
    await Program.create({
      id: 'opted-out-program',
      name: {
        fi: 'Ohjelma joka ei salli',
        en: 'Opted out program',
        sv: 'Program som inte tillater',
      },
      options: { allowStudentStartedProcess: false },
      level: 'master',
      international: true,
      enabled: true,
    })

    await StudyTrack.create({
      id: 'student-started-study-track',
      programId: 'student-started-program',
      name: {
        fi: 'Testiopintosuunta',
        en: 'Test study track',
        sv: 'Teststudieinriktning',
      },
    })

    await User.create({
      id: 'hy-hlo-student-1',
      username: 'student1',
      firstName: 'Student',
      lastName: 'One',
      email: 'student1@test.fi',
      language: 'fi',
      hasStudyRight: true,
    })
    await User.create({
      id: 'hy-hlo-student-2',
      username: 'student2',
      firstName: 'Student',
      lastName: 'Two',
      email: 'student2@test.fi',
      language: 'fi',
      hasStudyRight: true,
    })
    await User.create({
      id: 'hy-hlo-employee-1',
      username: 'employee1',
      firstName: 'Employee',
      lastName: 'One',
      email: 'employee1@test.fi',
      language: 'fi',
      hasStudyRight: false,
    })

    const ownAllowedInProgress = await Thesis.create({
      programId: 'student-started-program',
      studyTrackId: 'student-started-study-track',
      topic: ALLOWED_IN_PROGRESS_TOPIC,
      status: 'IN_PROGRESS',
      milestone: 1,
      startDate: '2024-01-01',
      targetDate: '2070-01-01',
    })
    const ownAllowedPlanning = await Thesis.create({
      programId: 'student-started-program',
      studyTrackId: 'student-started-study-track',
      topic: ALLOWED_PLANNING_TOPIC,
      status: 'PLANNING',
      startDate: '2024-01-01',
      targetDate: '2070-01-02',
    })
    const ownStaffStarted = await Thesis.create({
      programId: 'staff-started-program',
      topic: STAFF_STARTED_TOPIC,
      status: 'IN_PROGRESS',
      milestone: 2,
      startDate: '2024-01-01',
      targetDate: '2070-01-03',
    })
    const ownOptedOut = await Thesis.create({
      programId: 'opted-out-program',
      topic: OPTED_OUT_TOPIC,
      status: 'SUGGESTED',
      startDate: '2024-01-01',
      targetDate: '2070-01-04',
    })
    const otherStudentsAllowed = await Thesis.create({
      programId: 'student-started-program',
      studyTrackId: 'student-started-study-track',
      topic: OTHER_STUDENTS_TOPIC,
      status: 'PLANNING',
      startDate: '2024-01-01',
      targetDate: '2070-01-05',
    })

    await Author.create({
      userId: 'hy-hlo-student-1',
      thesisId: ownAllowedInProgress.id,
    })
    await Author.create({
      userId: 'hy-hlo-student-1',
      thesisId: ownAllowedPlanning.id,
    })
    await Author.create({
      userId: 'hy-hlo-student-1',
      thesisId: ownStaffStarted.id,
    })
    await Author.create({
      userId: 'hy-hlo-student-1',
      thesisId: ownOptedOut.id,
    })
    await Author.create({
      userId: 'hy-hlo-student-2',
      thesisId: otherStudentsAllowed.id,
    })
  })

  describe('GET /api/student/theses', () => {
    describe('when the user has no study right', () => {
      it('should return 401', async () => {
        const response = await request
          .get('/api/student/theses')
          .set(employeeHeaders)
        expect(response.status).toEqual(401)
      })
    })

    describe('when the user has a study right', () => {
      it('should return 200 and only the theses in programs that allow a student started process', async () => {
        const response = await request
          .get('/api/student/theses')
          .set(studentHeaders)

        expect(response.status).toEqual(200)
        expect(
          response.body.theses.map((thesis: any) => thesis.topic)
        ).toIncludeSameMembers([
          ALLOWED_IN_PROGRESS_TOPIC,
          ALLOWED_PLANNING_TOPIC,
        ])
        expect(
          response.body.theses.every(
            (thesis: any) =>
              thesis.program.options.allowStudentStartedProcess === true
          )
        ).toEqual(true)
      })

      it('should count only the filtered theses in totalCount', async () => {
        const response = await request
          .get('/api/student/theses')
          .set(studentHeaders)

        expect(response.status).toEqual(200)
        expect(response.body.totalCount).toEqual(2)
      })

      it('should paginate over the filtered theses', async () => {
        const firstPage = await request
          .get('/api/student/theses?limit=1&offset=0')
          .set(studentHeaders)
        const secondPage = await request
          .get('/api/student/theses?limit=1&offset=1')
          .set(studentHeaders)

        expect(firstPage.status).toEqual(200)
        expect(secondPage.status).toEqual(200)
        expect(firstPage.body.theses).toHaveLength(1)
        expect(secondPage.body.theses).toHaveLength(1)
        expect(firstPage.body.totalCount).toEqual(2)
        expect(secondPage.body.totalCount).toEqual(2)
        expect(firstPage.body.theses[0].topic).not.toEqual(
          secondPage.body.theses[0].topic
        )
      })

      it('should apply the filter to the available milestones and action needed aggregates', async () => {
        const response = await request
          .get('/api/student/theses')
          .set(studentHeaders)

        expect(response.status).toEqual(200)
        // Milestone 2 belongs to a thesis in a staff started program
        expect(response.body.availableMilestones).toEqual([1])
        // The only SUGGESTED thesis is in an opted out program
        expect(response.body.availableActionNeeded.suggested).toEqual(false)
      })

      it('should not allow turning the filter off from the query string', async () => {
        const response = await request
          .get('/api/student/theses?requireStudentStartedProcess=false')
          .set(studentHeaders)

        expect(response.status).toEqual(200)
        expect(response.body.totalCount).toEqual(2)
      })
    })
  })
})
