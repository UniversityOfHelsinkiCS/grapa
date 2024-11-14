import supertest from 'supertest'
import fs from 'fs'

import {
  Attachment,
  Author,
  Grader,
  Program,
  StudyTrack,
  Supervision,
  Thesis,
  User,
  ProgramManagement,
} from '../db/models'
import { userFields } from './config'

const userAttributesToFetch = userFields

jest.unstable_mockModule('./src/server/mailer/pate', () => ({
  default: jest.fn(),
}))
const sendEmail = (await import('../mailer/pate')).default

const app = (await import('../index')).default
const request = supertest.agent(app)

describe('Theisis router with mocks', () => {
  let mockUnlinkSync
  let user1
  let user2
  let user3
  let programManagerUser
  let thesis1
  let thesis2

  beforeEach(async () => {
    mockUnlinkSync = jest.fn()
    fs.unlinkSync = mockUnlinkSync

    await Program.create({
      id: 'Testing program',
      name: {
        fi: 'Testausohjelma',
        en: 'Testing program',
        sv: 'Testprogram',
      },
      level: 'master',
      international: true,
      enabled: true,
    })
    await Program.create({
      id: 'Updated program',
      name: {
        fi: 'Testausohjelma',
        en: 'Testing program',
        sv: 'Testprogram',
      },
      level: 'master',
      international: true,
      enabled: true,
    })
    await Program.create({
      id: 'New program',
      name: {
        fi: 'Testausohjelma',
        en: 'Testing program',
        sv: 'Testprogram',
      },
      level: 'master',
      international: true,
      enabled: true,
    })
    await StudyTrack.create({
      id: 'test-study-track-id',
      programId: 'Testing program',
      name: {
        fi: 'Test study track',
        en: 'Test study track',
        sv: 'Test study track',
      },
    })
    await StudyTrack.create({
      id: 'new-test-study-track-id',
      programId: 'New program',
      name: {
        fi: 'New test study track',
        en: 'New test study track',
        sv: 'New test study track',
      },
    })

    await User.create({
      username: 'test1',
      firstName: 'test1',
      lastName: 'test1',
      email: 'test@test.test1',
      language: 'fi',
    })
    await User.create({
      username: 'test2',
      firstName: 'test2',
      lastName: 'test2',
      email: 'test@test.test2',
      language: 'fi',
    })
    await User.create({
      username: 'test3',
      firstName: 'test3',
      lastName: 'test3',
      email: 'test@test.test3',
      language: 'fi',
    })
    user1 = (
      await User.findOne({
        where: { username: 'test1' },
        attributes: userAttributesToFetch,
      })
    ).toJSON()
    user2 = (
      await User.findOne({
        where: { username: 'test2' },
        attributes: userAttributesToFetch,
      })
    ).toJSON()
    user3 = (
      await User.findOne({
        where: { username: 'test3' },
        attributes: userAttributesToFetch,
      })
    ).toJSON()

    await User.create({
      username: 'programManagerUser',
      firstName: 'programManagerUser',
      lastName: 'programManagerUser',
      email: 'test@test.programManagerUser',
      language: 'fi',
    })

    programManagerUser = (
      await User.findOne({
        where: { username: 'programManagerUser' },
        attributes: userAttributesToFetch,
      })
    ).toJSON()

    thesis1 = await Thesis.create({
      programId: 'Testing program',
      studyTrackId: 'test-study-track-id',
      topic: 'test topic',
      status: 'PLANNING',
      startDate: '1970-01-01',
      targetDate: '2070-01-01',
    })
    thesis2 = await Thesis.create({
      programId: 'Testing program',
      studyTrackId: 'test-study-track-id',
      topic: 'test topic',
      status: 'PLANNING',
      startDate: '1970-01-01',
      targetDate: '2070-01-01',
    })

    await Supervision.create({
      userId: user1.id,
      thesisId: thesis1.id,
      percentage: 50,
      isPrimarySupervisor: true,
    })
    await Author.create({
      userId: user2.id,
      thesisId: thesis1.id,
    })
    await Grader.create({
      userId: user3.id,
      thesisId: thesis1.id,
      isPrimaryGrader: true,
    })
    await Attachment.create({
      thesisId: thesis1.id,
      label: 'researchPlan',
      filename: 'testfile.pdf1',
      mimetype: 'application/pdf1',
      originalname: 'testfile.pdf1',
    })
    await Attachment.create({
      thesisId: thesis1.id,
      label: 'waysOfWorking',
      filename: 'testfile.pdf2',
      mimetype: 'application/pdf2',
      originalname: 'testfile.pdf2',
    })
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  describe('when the status is changed from PLANNING to IN_PROGRESS', () => {
    describe('when the user is an admin', () => {
      it('should call the sendEmail function and return 200', async () => {
        const updatedThesis = {
          programId: 'Updated program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'Updated topic',
          status: 'IN_PROGRESS',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isPrimarySupervisor: true,
            },
          ],
          authors: [user2],
          graders: [
            {
              user: user3,
              isPrimaryGrader: true,
            },
          ],
          waysOfWorking: {
            filename: 'testfile.pdf2',
            name: 'testfile.pdf2',
            mimetype: 'application/pdf2',
          },
          researchPlan: {
            filename: 'testfile.pdf1',
            name: 'testfile.pdf1',
            mimetype: 'application/pdf1',
          },
        }

        const response = await request
          .put(`/api/theses/${thesis1.id}`)
          .set('hygroupcn', 'grp-toska')
          .field('json', JSON.stringify(updatedThesis))

        expect(response.status).toEqual(200)
        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(sendEmail).toHaveBeenCalledWith(
          [user1.email, user2.email],
          expect.any(String),
          'Prethesis - Thesis status changed to IN PROGRESS'
        )
      })
    })

    describe('when the user is a program manager', () => {
      beforeEach(async () => {
        await ProgramManagement.create({
          userId: programManagerUser.id,
          programId: 'Testing program',
          isThesisApprover: true,
        })
      })

      it('should call the sendEmail function and return 200', async () => {
        const updatedThesis = {
          programId: 'Testing program',
          studyTrackId: 'test-study-track-id',
          topic: 'test topic',
          status: 'IN_PROGRESS',
          startDate: '1970-01-01',
          targetDate: '2070-01-01',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isPrimarySupervisor: true,
            },
          ],
          authors: [user2],
          graders: [
            {
              user: user3,
              isPrimaryGrader: true,
            },
          ],
          waysOfWorking: {
            filename: 'testfile.pdf2',
            name: 'testfile.pdf2',
            mimetype: 'application/pdf2',
          },
          researchPlan: {
            filename: 'testfile.pdf1',
            name: 'testfile.pdf1',
            mimetype: 'application/pdf1',
          },
        }

        const response = await request
          .put(`/api/theses/${thesis2.id}`)
          .set({ uid: programManagerUser.id, hygroupcn: 'hy-employees' })
          .field('json', JSON.stringify(updatedThesis))

        expect(response.status).toEqual(200)
        expect(sendEmail).toHaveBeenCalledTimes(1)
        expect(sendEmail).toHaveBeenCalledWith(
          [user1.email, user2.email],
          expect.any(String),
          'Prethesis - Thesis status changed to IN PROGRESS'
        )
      })
    })
  })
})
