import supertest from 'supertest'
import fs from 'fs'
import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import app from '../index'
import {
  Attachment,
  Author,
  EventLog,
  Grader,
  Program,
  ProgramManagement,
  StudyTrack,
  Supervision,
  Thesis,
  User,
} from '../db/models'
import { userFields } from './config'

const request = supertest.agent(app)

const userAttributesToFetch = userFields

describe('thesis router', () => {
  let mockUnlinkSync
  beforeEach(() => {
    mockUnlinkSync = jest.fn()
    fs.unlinkSync = mockUnlinkSync
  })

  describe('when the user is not a teacher', () => {
    describe('GET /api/theses', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/theses')
        expect(response.status).toEqual(403)
      })
    })

    describe('DELETE /api/theses/:id', () => {
      it('should return 403', async () => {
        const response = await request.delete('/api/theses/1')
        expect(response.status).toEqual(403)
      })
    })

    describe('POST /api/theses', () => {
      it('should return 403', async () => {
        const response = await request.post('/api/theses')
        expect(response.status).toEqual(403)
      })
    })

    describe('PUT /api/theses/:id', () => {
      it('should return 403', async () => {
        const response = await request.put('/api/theses/1')
        expect(response.status).toEqual(403)
      })
    })

    describe('GET /api/theses/:id', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/theses/1')
        expect(response.status).toEqual(403)
      })
    })
  })

  describe('when there are no theses', () => {
    describe('GET /api/theses', () => {
      it('should return 200 and an empty array', async () => {
        const response = await request
          .get('/api/theses')
          .set('hygroupcn', 'grp-toska')
        expect(response.status).toEqual(200)
        expect(response.body).toEqual([])
      })
    })
  })

  describe('when there are theses saved in the DB', () => {
    let user1
    let user2
    let user3
    let user4
    let user5
    let thesis1

    beforeEach(async () => {
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
      await User.create({
        username: 'test4',
        firstName: 'test4',
        lastName: 'test4',
        email: 'test@test.test4',
        language: 'fi',
      })
      await User.create({
        username: 'test5',
        firstName: 'test5',
        lastName: 'test5',
        email: 'test@test.test5',
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
      user4 = (
        await User.findOne({
          where: { username: 'test4' },
          attributes: userAttributesToFetch,
        })
      ).toJSON()
      user5 = (
        await User.findOne({
          where: { username: 'test5' },
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

      await Supervision.create({
        userId: user1.id,
        thesisId: thesis1.id,
        percentage: 50,
        isPrimarySupervisor: true,
      })
      await Supervision.create({
        userId: user3.id,
        thesisId: thesis1.id,
        percentage: 50,
        isPrimarySupervisor: false,
      })
      await Author.create({
        userId: user2.id,
        thesisId: thesis1.id,
      })
      await Grader.create({
        userId: user4.id,
        thesisId: thesis1.id,
        isPrimaryGrader: true,
      })
      await Grader.create({
        userId: user5.id,
        thesisId: thesis1.id,
        isPrimaryGrader: false,
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

    describe('GET /api/theses', () => {
      describe('when fetching all theses a user has access to', () => {
        describe('when the user is an admin', () => {
          it('should return 200 and the theses', async () => {
            const response = await request
              .get('/api/theses')
              .set('hygroupcn', 'grp-toska')
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([
              {
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                authors: [user2],
                researchPlan: {
                  filename: 'testfile.pdf1',
                  name: 'testfile.pdf1',
                  mimetype: 'application/pdf1',
                },
                waysOfWorking: {
                  filename: 'testfile.pdf2',
                  name: 'testfile.pdf2',
                  mimetype: 'application/pdf2',
                },
                supervisions: expect.toIncludeSameMembers([
                  {
                    user: user1,
                    percentage: 50,
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                  {
                    user: user3,
                    percentage: 50,
                    isExternal: false,
                    isPrimarySupervisor: false,
                  },
                ]),
              },
            ])
          })
        })

        describe('when the user is a teacher-supervisor of one thesis and is a manager of the program that thesis belongs to', () => {
          let thesisSupervisedByOtherUser
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Testing program',
              userId: user1.id,
            })
            thesisSupervisedByOtherUser = await Thesis.create({
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic:
                'Thesis in the same program but supervised by another user',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2050-01-01',
            })

            await Supervision.create({
              userId: user2.id,
              thesisId: thesisSupervisedByOtherUser.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return theses that the teacher supervisers and theses of the managed program but no other theses', async () => {
            const response = await request
              .get('/api/theses')
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toHaveLength(2)
            expect(response.body).toMatchObject([
              {
                topic:
                  'Thesis in the same program but supervised by another user',
              },
              {
                topic: 'test topic',
              },
            ])
          })
        })

        describe('when the user is a teacher-supervisor of one thesis and is a manager of the program that thesis does not belong to', () => {
          let thesisSupervisedByOtherUser
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Updated program',
              userId: user1.id,
            })
            thesisSupervisedByOtherUser = await Thesis.create({
              programId: 'Updated program',
              studyTrackId: 'test-study-track-id',
              topic:
                'Thesis in the program managed by the user, supervised by another user',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2050-01-01',
            })

            await Supervision.create({
              userId: user2.id,
              thesisId: thesisSupervisedByOtherUser.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return theses that the teacher supervisers and theses of the managed program but no other theses', async () => {
            const response = await request
              .get('/api/theses')
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toHaveLength(2)
            expect(response.body).toMatchObject([
              {
                topic:
                  'Thesis in the program managed by the user, supervised by another user',
              },
              {
                topic: 'test topic',
              },
            ])
          })
        })

        describe('when the user does not supervise theses but is a manager of a program', () => {
          let thesisSupervisedByOtherUser
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Updated program',
              userId: user2.id,
            })
            thesisSupervisedByOtherUser = await Thesis.create({
              programId: 'Updated program',
              studyTrackId: 'test-study-track-id',
              topic:
                'Thesis in the program managed by the user, supervised by another user',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2050-01-01',
            })

            await Supervision.create({
              userId: user1.id,
              thesisId: thesisSupervisedByOtherUser.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return theses of the managed program but no other theses', async () => {
            const response = await request
              .get('/api/theses')
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toHaveLength(1)
            expect(response.body).toMatchObject([
              {
                topic:
                  'Thesis in the program managed by the user, supervised by another user',
              },
            ])
          })
        })

        describe('when the user is a teacher and is a supervisor of the thesis', () => {
          it('should return 200 and the theses', async () => {
            const response = await request
              .get('/api/theses')
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([
              {
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                authors: [user2],
                researchPlan: {
                  filename: 'testfile.pdf1',
                  name: 'testfile.pdf1',
                  mimetype: 'application/pdf1',
                },
                waysOfWorking: {
                  filename: 'testfile.pdf2',
                  name: 'testfile.pdf2',
                  mimetype: 'application/pdf2',
                },
                supervisions: expect.toIncludeSameMembers([
                  {
                    user: user1,
                    percentage: 50,
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                  {
                    user: user3,
                    percentage: 50,
                    isExternal: false,
                    isPrimarySupervisor: false,
                  },
                ]),
              },
            ])
          })
        })

        describe('when the user is a teacher and is not a supervisor of the thesis', () => {
          it('should return 200 and the theses', async () => {
            const response = await request.get('/api/theses').set({
              uid: 'test-id-of-not-supervisor',
              hygroupcn: 'hy-employees',
            })
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([])
          })
        })
      })

      describe('when fetching only theses that user supervises', () => {
        let teacherUser
        let programManagerUser
        let adminUser
        let thesis2
        let thesis3
        let thesis4

        beforeEach(async () => {
          await User.create({
            username: 'teacherUser',
            firstName: 'teacherUser',
            lastName: 'teacherUser',
            email: 'test@test.teacherUser',
            language: 'fi',
          })
          await User.create({
            username: 'programManagerUser',
            firstName: 'programManagerUser',
            lastName: 'programManagerUser',
            email: 'test@test.programManagerUser',
            language: 'fi',
          })
          await User.create({
            username: 'adminUser',
            firstName: 'adminUser',
            lastName: 'adminUser',
            email: 'test@test.adminUser',
            language: 'fi',
            isAdmin: true,
          })
          teacherUser = (
            await User.findOne({
              where: { username: 'teacherUser' },
              attributes: userAttributesToFetch,
            })
          ).toJSON()
          programManagerUser = (
            await User.findOne({
              where: { username: 'programManagerUser' },
              attributes: userAttributesToFetch,
            })
          ).toJSON()
          adminUser = (
            await User.findOne({
              where: { username: 'adminUser' },
              attributes: userAttributesToFetch,
            })
          ).toJSON()

          thesis2 = await Thesis.create({
            programId: 'Testing program',
            studyTrackId: 'test-study-track-id',
            topic: 'test topic',
            status: 'PLANNING',
            startDate: '1970-01-01',
            targetDate: '2070-01-01',
          })
          thesis3 = await Thesis.create({
            programId: 'Testing program',
            studyTrackId: 'test-study-track-id',
            topic: 'test topic',
            status: 'PLANNING',
            startDate: '1970-01-01',
            targetDate: '2070-01-01',
          })
          thesis4 = await Thesis.create({
            programId: 'Testing program',
            studyTrackId: 'test-study-track-id',
            topic: 'test topic',
            status: 'PLANNING',
            startDate: '1970-01-01',
            targetDate: '2070-01-01',
          })

          await Supervision.create({
            userId: teacherUser.id,
            thesisId: thesis2.id,
            percentage: 100,
            isPrimarySupervisor: true,
          })
          await Supervision.create({
            userId: programManagerUser.id,
            thesisId: thesis3.id,
            percentage: 100,
            isPrimarySupervisor: true,
          })
          await Supervision.create({
            userId: adminUser.id,
            thesisId: thesis4.id,
            percentage: 100,
            isPrimarySupervisor: true,
          })

          await ProgramManagement.create({
            programId: 'Testing program',
            userId: programManagerUser.id,
          })
        })

        describe('when the teacher user fetches own theses', () => {
          it('should return all theses supervised by the user', async () => {
            const response = await request
              .get('/api/theses?onlySupervised=true')
              .set({ uid: teacherUser.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([
              {
                id: thesis2.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: teacherUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })

        describe('when the teacher user fetches paginated own theses', () => {
          let thesis5

          beforeEach(async () => {
            thesis5 = await Thesis.create({
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2070-01-01',
            })

            await Supervision.create({
              userId: teacherUser.id,
              thesisId: thesis5.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return the first page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=0&limit=1')
              .set({ uid: teacherUser.id, hygroupcn: 'hy-employees' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis2.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: teacherUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })

          it('should return the second page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=1&limit=1')
              .set({ uid: teacherUser.id, hygroupcn: 'hy-employees' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis5.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: teacherUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })

        describe('when the program manager user fetches own theses', () => {
          it('should return all theses supervised by the user, but not the others in the managed program', async () => {
            const response = await request
              .get('/api/theses?onlySupervised=true')
              .set({ uid: programManagerUser.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([
              {
                id: thesis3.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: programManagerUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })

        describe('when the program manager user fetches paginated own theses', () => {
          let thesis6

          beforeEach(async () => {
            thesis6 = await Thesis.create({
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2070-01-01',
            })

            await Supervision.create({
              userId: programManagerUser.id,
              thesisId: thesis6.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return the first page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=0&limit=1')
              .set({ uid: programManagerUser.id, hygroupcn: 'hy-employees' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis3.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: programManagerUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })

          it('should return the second page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=1&limit=1')
              .set({ uid: programManagerUser.id, hygroupcn: 'hy-employees' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis6.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: programManagerUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })

        describe('when an admin user fetches own theses', () => {
          it('should return all theses supervised by the user and only those', async () => {
            const response = await request
              .get('/api/theses?onlySupervised=true')
              .set({ uid: adminUser.id, hygroupcn: 'grp-toska' })
            expect(response.status).toEqual(200)
            expect(response.body).toMatchObject([
              {
                id: thesis4.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: adminUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })

        describe('when the admin user fetches paginated own theses', () => {
          let thesis7

          beforeEach(async () => {
            thesis7 = await Thesis.create({
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01',
              targetDate: '2070-01-01',
            })

            await Supervision.create({
              userId: adminUser.id,
              thesisId: thesis7.id,
              percentage: 100,
              isPrimarySupervisor: true,
            })
          })

          it('should return the first page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=0&limit=1')
              .set({ uid: adminUser.id, hygroupcn: 'grp-toska' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis4.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: adminUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })

          it('should return the second page of theses', async () => {
            const response = await request
              .get('/api/theses/paginate?onlySupervised=true&&offset=1&limit=1')
              .set({ uid: adminUser.id, hygroupcn: 'grp-toska' })

            expect(response.status).toEqual(200)
            expect(response.body.totalCount).toBe(2)
            expect(response.body.theses).toMatchObject([
              {
                id: thesis7.id,
                programId: 'Testing program',
                studyTrackId: 'test-study-track-id',
                topic: 'test topic',
                status: 'PLANNING',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: adminUser,
                    percentage: 100,
                    isPrimarySupervisor: true,
                  },
                ],
              },
            ])
          })
        })
      })
    })

    describe('DELETE /api/theses/:id', () => {
      describe('when the user is an admin', () => {
        it('should return 204, delete the thesis and write to event log', async () => {
          const response = await request
            .delete(`/api/theses/${thesis1.id}`)
            .set('hygroupcn', 'grp-toska')
          expect(response.status).toEqual(204)
          const thesis = await Thesis.findByPk(thesis1.id)
          expect(thesis).toBeNull()

          expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
          expect(fs.unlinkSync).toHaveBeenCalledWith(
            '/opt/app-root/src/uploads/testfile.pdf1'
          )
          expect(fs.unlinkSync).toHaveBeenCalledWith(
            '/opt/app-root/src/uploads/testfile.pdf2'
          )

          const eventLog = await EventLog.findOne({
            where: { 'data.id': thesis1.id, type: 'THESIS_DELETED' },
          })
          expect(eventLog).not.toBeNull()
        })

        it('should return 404 and not log if the thesis does not exist', async () => {
          const response = await request
            .delete('/api/theses/999')
            .set('hygroupcn', 'grp-toska')
          expect(response.status).toEqual(404)
          const eventLog = await EventLog.findOne({
            where: { type: 'THESIS_DELETED' },
          })
          expect(eventLog).toBeNull()
        })
      })

      describe('when the user is a teacher', () => {
        describe('when the user is a supervisor of the thesis being deleted', () => {
          it('should return 204, delete the thesis and log the event', async () => {
            const response = await request
              .delete(`/api/theses/${thesis1.id}`)
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(204)
            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis).toBeNull()

            expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf2'
            )
            const eventLog = await EventLog.findOne({
              where: { 'data.id': thesis1.id, type: 'THESIS_DELETED' },
            })
            expect(eventLog).not.toBeNull()
          })
        })

        describe('when the user is not a supervisor of the thesis deleted', () => {
          it('should return 404 and not log to eventLog', async () => {
            const response = await request
              .delete(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(404)
            const eventLog = await EventLog.findOne({
              where: { type: 'THESIS_DELETED' },
            })
            expect(eventLog).toBeNull()
          })
        })
      })

      describe('when the user is a program manager', () => {
        describe("when the user is a manager of the thesis' program", () => {
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Testing program',
              userId: user2.id,
            })
          })

          it('should return 204, delete the thesis and log the event', async () => {
            const response = await request
              .delete(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(204)
            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis).toBeNull()

            expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf2'
            )

            const eventLog = await EventLog.findOne({
              where: { 'data.id': thesis1.id, type: 'THESIS_DELETED' },
            })
            expect(eventLog).not.toBeNull()
          })
        })

        describe("when the user is not a manager of the thesis' program", () => {
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Updated program',
              userId: user2.id,
            })
          })

          it('should return 404 and not log the event', async () => {
            const response = await request
              .delete(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
            expect(response.status).toEqual(404)

            const eventLog = await EventLog.findOne({
              where: { type: 'THESIS_DELETED' },
            })
            expect(eventLog).toBeNull()
          })
        })
      })
    })

    describe('POST /api/theses', () => {
      it('should return 201 and create a new thesis', async () => {
        const newThesis = {
          programId: 'New program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isExternal: false,
              isPrimarySupervisor: true,
            },
          ],
          graders: [
            {
              user: user4,
              isPrimaryGrader: true,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ],
          authors: [user2],
        }
        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .attach(
            'researchPlan',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))
        expect(response.status).toEqual(201)

        delete newThesis.supervisions
        delete newThesis.authors
        delete newThesis.graders

        expect(response.body).toMatchObject(newThesis)

        const thesis = await Thesis.findByPk(response.body.id)
        expect(thesis).not.toBeNull()
      })

      it('should return 201 with external supervisors', async () => {
        const extUserData = {
          firstName: 'External',
          lastName: 'Supervisor',
          email: 'ext-test@helsinki.fi',
          affiliation: 'External affiliation',
        }

        const newThesis = {
          programId: 'New program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 50,
              isExternal: false,
              isPrimarySupervisor: true,
            },
            {
              user: extUserData,
              percentage: 50,
              isExternal: true,
              isPrimarySupervisor: false,
            },
          ],
          graders: [
            {
              user: user4,
              isPrimaryGrader: true,
              isExternal: false,
            },
          ],
          authors: [user2],
        }

        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .attach(
            'researchPlan',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))

        expect(response.status).toEqual(201)

        const extUser = await User.findOne({
          where: { email: extUserData.email },
        })
        expect(extUser).not.toBeNull()
        expect(extUser).toMatchObject(extUserData)
        expect(extUser.isExternal).toBe(true)
      })

      it('should return 201 with external graders', async () => {
        const extUserData = {
          firstName: 'External',
          lastName: 'Grader',
          email: 'ext-grader@helsinki.fi',
          affiliation: 'External affiliation',
        }

        const newThesis = {
          programId: 'New program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isExternal: false,
              isPrimarySupervisor: true,
            },
          ],
          graders: [
            {
              user: user4,
              isPrimaryGrader: true,
              isExternal: false,
            },
            {
              user: extUserData,
              isPrimaryGrader: false,
              isExternal: true,
            },
          ],
          authors: [user2],
        }

        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .attach(
            'researchPlan',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))

        expect(response.status).toEqual(201)

        const extUser = await User.findOne({
          where: { email: extUserData.email },
        })
        expect(extUser).not.toBeNull()
        expect(extUser).toMatchObject(extUserData)
        expect(extUser.isExternal).toBe(true)
      })

      it('should return 400 if the request is missing a required field', async () => {
        const newThesis = {
          programId: 'New program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isExternal: false,
              isPrimarySupervisor: true,
            },
          ],
          graders: [
            {
              user: user4,
              isPrimaryGrader: true,
              isExternal: false,
            },
          ],
          authors: [user2],
        }
        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))

        // We expect the response to be 400 because the request is missing the researchPlan attachment
        expect(response.status).toEqual(400)
      })

      it('should return 400 if the request is missing the primary supervisor', async () => {
        const newThesis = {
          programId: 'New program',
          studyTrackId: 'new-test-study-track-id',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
              isExternal: false,
              isPrimarySupervisor: false,
            },
          ],
          graders: [
            {
              user: user4,
              isPrimaryGrader: true,
              isExternal: false,
            },
          ],
          authors: [user2],
        }

        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .attach(
            'researchPlan',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))

        expect(response.status).toEqual(400)
      })

      describe('when trying to create a thesis with status other than PLANNING', () => {
        describe('when the user is an admin', () => {
          it('should return 201 and create the thesis', async () => {
            const newThesis = {
              programId: 'New program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'New topic',
              status: 'IN_PROGRESS',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .post('/api/theses')
              .set('hygroupcn', 'grp-toska')
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(newThesis))
            expect(response.status).toEqual(201)
          })
        })

        describe("when the user is a manager of the thesis' program", () => {
          it('should return 201 and create the thesis', async () => {
            await ProgramManagement.create({
              programId: 'New program',
              userId: user2.id,
            })

            const newThesis = {
              programId: 'New program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'New topic',
              status: 'IN_PROGRESS',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .post('/api/theses')
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(newThesis))
            expect(response.status).toEqual(201)
          })
        })

        describe('when the user is a manager of a different program', () => {
          it('should return 403 and a correct error message', async () => {
            await ProgramManagement.create({
              programId: 'Updated program',
              userId: user2.id,
            })

            const newThesis = {
              programId: 'New program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'New topic',
              status: 'IN_PROGRESS',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .post('/api/theses')
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(newThesis))

            expect(response.status).toEqual(403)
            expect(response.body).toEqual({
              error:
                'User is not authorized to change the status of the thesis',
              data: {
                programId: [
                  'User is not authorized to change the status of the thesis',
                ],
              },
            })
          })
        })

        describe('when the user is a teacher and is a supervisor of the thesis', () => {
          it('should return 403 and a correct error message', async () => {
            const newThesis = {
              programId: 'New program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'New topic',
              status: 'IN_PROGRESS',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .post('/api/theses')
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(newThesis))
            expect(response.status).toEqual(403)
            expect(response.body).toEqual({
              error:
                'User is not authorized to change the status of the thesis',
              data: {
                programId: [
                  'User is not authorized to change the status of the thesis',
                ],
              },
            })
          })
        })
      })

      describe('when the request contains duplicate supervisors', () => {
        it('should return 400 and create the thesis', async () => {
          const newThesis = {
            programId: 'Test program',
            studyTrackId: 'new-test-study-track-id',
            topic: 'Test topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 50,
                isExternal: false,
                isPrimarySupervisor: true,
              },
              {
                user: user1,
                percentage: 50,
                isExternal: false,
                isPrimarySupervisor: false,
              },
            ],
            graders: [
              {
                user: user4,
                isPrimaryGrader: true,
                isExternal: false,
              },
            ],
            authors: [user2],
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
            .post('/api/theses')
            .set('hygroupcn', 'grp-toska')
            .field('json', JSON.stringify(newThesis))

          expect(response.status).toEqual(400)
        })
      })

      describe('when the request contains duplicate graders', () => {
        it('should return 400 and not create the thesis', async () => {
          const newThesis = {
            programId: 'Test program',
            studyTrackId: 'new-test-study-track-id',
            topic: 'Test topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
                isExternal: false,
                isPrimarySupervisor: true,
              },
            ],
            graders: [
              {
                user: user4,
                isPrimaryGrader: true,
                isExternal: false,
              },
              {
                user: user4,
                isPrimaryGrader: false,
                isExternal: false,
              },
            ],
            authors: [user2],
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
            .post('/api/theses')
            .set('hygroupcn', 'grp-toska')
            .field('json', JSON.stringify(newThesis))

          expect(response.status).toEqual(400)
        })
      })
    })

    describe('PUT /api/theses/:id', () => {
      describe('when user is an admin', () => {
        describe('when both attachments are updated', () => {
          it('should return 200 and update the thesis', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                },
                {
                  user: user5,
                  isPrimaryGrader: false,
                },
              ],
              authors: [user2],
            }

            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set('hygroupcn', 'grp-toska')
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf2'
            )

            expect(response.status).toEqual(200)
            delete updatedThesis.supervisions
            delete updatedThesis.authors
            expect(response.body).toMatchObject(updatedThesis)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Updated program')
            expect(thesis.topic).toEqual('Updated topic')
          })
        })

        describe('when one attachment is updated and another stays the same', () => {
          it('should return 200 and update the thesis', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
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
                  user: user4,
                  isPrimaryGrader: true,
                },
              ],
              waysOfWorking: {
                filename: 'testfile.pdf2',
                name: 'testfile.pdf2',
                mimetype: 'application/pdf2',
              },
            }
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set('hygroupcn', 'grp-toska')
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(1)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )

            expect(response.status).toEqual(200)
            delete updatedThesis.supervisions
            delete updatedThesis.authors
            delete updatedThesis.waysOfWorking
            expect(response.body).toMatchObject(updatedThesis)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Updated program')
            expect(thesis.topic).toEqual('Updated topic')
          })
        })

        describe('when neither of the attachments are updated', () => {
          it('should return 200 and update the thesis', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
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
                  user: user4,
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

            expect(fs.unlinkSync).toHaveBeenCalledTimes(0)

            expect(response.status).toEqual(200)
            delete updatedThesis.supervisions
            delete updatedThesis.authors
            delete updatedThesis.waysOfWorking
            delete updatedThesis.researchPlan
            expect(response.body).toMatchObject(updatedThesis)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Updated program')
            expect(thesis.topic).toEqual('Updated topic')
          })
        })

        describe('when the request contains duplicate supervisors', () => {
          it('should return 400 and not update the thesis', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 50,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
                {
                  user: user1,
                  percentage: 50,
                  isExternal: false,
                  isPrimarySupervisor: false,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
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

            expect(response.status).toEqual(400)

            const thesisSupervisions = await Supervision.findAll({
              where: { thesisId: thesis1.id },
            })

            expect(thesisSupervisions).toHaveLength(2)
            expect(thesisSupervisions).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  userId: user1.id,
                  percentage: 50,
                  isPrimarySupervisor: true,
                }),
                expect.objectContaining({
                  userId: user3.id,
                  percentage: 50,
                  isPrimarySupervisor: false,
                }),
              ])
            )
          })
        })

        describe('when the request contains duplicate graders', () => {
          it('should return 400 and not update the thesis', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
                {
                  user: user4,
                  isPrimaryGrader: false,
                  isExternal: false,
                },
              ],
              authors: [user2],
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

            expect(response.status).toEqual(400)

            const thesisGraders = await Grader.findAll({
              where: { thesisId: thesis1.id },
            })

            expect(thesisGraders).toHaveLength(2)
            expect(thesisGraders).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  userId: user4.id,
                  isPrimaryGrader: true,
                }),
                expect.objectContaining({
                  userId: user5.id,
                  isPrimaryGrader: false,
                }),
              ])
            )
          })
        })

        describe('when the request contains external supervisors', () => {
          it('should return 200 and update the thesis', async () => {
            const extUserData = {
              firstName: 'External',
              lastName: 'Supervisor',
              email: 'ext-test@helsinki.fi',
              affiliation: 'External affiliation',
            }

            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 50,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
                {
                  user: extUserData,
                  percentage: 50,
                  isExternal: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
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

            const extUser = await User.findOne({
              where: { email: extUserData.email },
            })
            expect(extUser).not.toBeNull()
            expect(extUser).toMatchObject(extUserData)
            expect(extUser.isExternal).toBe(true)

            const thesisSupervisions = await Supervision.findAll({
              where: { thesisId: thesis1.id },
            })

            expect(thesisSupervisions).toHaveLength(2)
            expect(thesisSupervisions).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  userId: user1.id,
                  percentage: 50,
                  isPrimarySupervisor: true,
                }),
                expect.objectContaining({
                  userId: extUser.id,
                  percentage: 50,
                }),
              ])
            )
          })

          it('should return 400 when duplicate external supervisors', async () => {
            const extUserData = {
              firstName: 'External',
              lastName: 'Supervisor',
              email: 'ext-test@helsinki.fi',
              affiliation: 'External affiliation',
            }

            const duplicateExtUserData = {
              firstName: 'test1',
              lastName: 'test1',
              email: 'test@test.test1',
              affiliation: 'External affiliation',
            }

            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 34,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
                {
                  user: extUserData,
                  percentage: 33,
                  isExternal: true,
                },
                {
                  user: duplicateExtUserData,
                  percentage: 33,
                  isExternal: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
              authors: [user2],
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

            expect(response.status).toEqual(400)

            // Check that the external users is not created
            const extUser = await User.findOne({
              where: { email: extUserData.email },
            })
            expect(extUser).toBeNull()

            const duplicateExtUser = await User.findOne({
              where: { email: duplicateExtUserData.email, isExternal: true },
            })
            expect(duplicateExtUser).toBeNull()

            // Check that the original supervisor is not updated (user1)
            const originalSupervisor = await User.findOne({
              where: { email: user1.email },
            })
            expect(originalSupervisor).not.toBeNull()
            expect(originalSupervisor).toMatchObject(user1)

            // Check that the supervisions are correct (user1 and user3) defined in the thesis1
            const thesisSupervisions = await Supervision.findAll({
              where: { thesisId: thesis1.id },
            })
            expect(thesisSupervisions).toHaveLength(2)

            // Here we check that the supervisions contain the correct users and percentages
            // even though the updated data contains duplicate external supervisors with different percentages
            // The percentages should be calculated based on the total number of valid supervisors
            expect(thesisSupervisions).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  userId: user1.id,
                  percentage: 50,
                  isPrimarySupervisor: true,
                }),
                expect.objectContaining({
                  userId: user3.id,
                  percentage: 50,
                  isPrimarySupervisor: false,
                }),
              ])
            )
          })
        })

        describe('when the thesis does not exist', () => {
          it('should return 404', async () => {
            const updatedThesis = {
              programId: 'Updated program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              authors: [user2],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
              ],
            }
            const response = await request
              .put('/api/theses/999')
              .set('hygroupcn', 'grp-toska')
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))
            expect(response.status).toEqual(404)
          })
        })
      })

      describe('when the request contains external graders', () => {
        it('should return 200 and update the thesis', async () => {
          const extUserData = {
            firstName: 'External',
            lastName: 'Supervisor',
            email: 'ext-grader@helsinki.fi',
            affiliation: 'External affiliation',
          }

          const updatedThesis = {
            programId: 'Updated program',
            studyTrackId: 'new-test-study-track-id',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
                isExternal: false,
                isPrimarySupervisor: true,
              },
            ],
            graders: [
              {
                user: user4,
                isPrimaryGrader: true,
                isExternal: false,
              },
              {
                user: extUserData,
                isPrimaryGrader: false,
                isExternal: true,
              },
            ],
            authors: [user2],
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

          const extUser = await User.findOne({
            where: { email: extUserData.email },
          })
          expect(extUser).not.toBeNull()
          expect(extUser).toMatchObject(extUserData)
          expect(extUser.isExternal).toBe(true)

          const thesisGraders = await Grader.findAll({
            where: { thesisId: thesis1.id },
          })

          expect(thesisGraders).toHaveLength(2)
          expect(thesisGraders).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                userId: user4.id,
                isPrimaryGrader: true,
              }),
              expect.objectContaining({
                userId: extUser.id,
                isPrimaryGrader: false,
              }),
            ])
          )
        })
      })

      describe('when the user is a teacher', () => {
        let updatedThesis

        beforeEach(() => {
          updatedThesis = {
            programId: 'Updated program',
            studyTrackId: 'new-test-study-track-id',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
                isExternal: false,
                isPrimarySupervisor: true,
              },
            ],
            graders: [
              {
                user: user4,
                isPrimaryGrader: true,
                isExternal: false,
              },
              {
                user: user5,
                isPrimaryGrader: false,
                isExternal: false,
              },
            ],
            authors: [user2],
          }
        })

        describe('when the user is a supervisor of the thesis being updated', () => {
          it('should return 200 and update the thesis', async () => {
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set({ uid: user1.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf2'
            )

            expect(response.status).toEqual(200)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Updated program')
            expect(thesis.topic).toEqual('Updated topic')
          })
        })

        describe('when the user is not a supervisor of the thesis being updated', () => {
          it('should return 404 and not update thesis', async () => {
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(0)

            expect(response.status).toEqual(404)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Testing program')
            expect(thesis.topic).toEqual('test topic')
          })
        })
      })

      describe('when the user is a program manager', () => {
        let updatedThesis

        beforeEach(() => {
          updatedThesis = {
            programId: 'Updated program',
            studyTrackId: 'new-test-study-track-id',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
                isExternal: false,
                isPrimarySupervisor: true,
              },
            ],
            graders: [
              {
                user: user4,
                isPrimaryGrader: true,
                isExternal: false,
              },
              {
                user: user5,
                isPrimaryGrader: false,
                isExternal: false,
              },
            ],
            authors: [user2],
          }
        })

        describe('when the user is a manager of the same program that the updated thesis is of', () => {
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Testing program',
              userId: user2.id,
            })
          })

          it('should return 200 and update the thesis', async () => {
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf1'
            )
            expect(fs.unlinkSync).toHaveBeenCalledWith(
              '/opt/app-root/src/uploads/testfile.pdf2'
            )

            expect(response.status).toEqual(200)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Updated program')
            expect(thesis.topic).toEqual('Updated topic')
          })
        })

        describe('when the user is a manager of a different program that the updated thesis is of', () => {
          beforeEach(async () => {
            await ProgramManagement.create({
              programId: 'Updated program',
              userId: user2.id,
            })
          })

          it('should return 200 and update the thesis', async () => {
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(fs.unlinkSync).toHaveBeenCalledTimes(0)

            expect(response.status).toEqual(404)

            const thesis = await Thesis.findByPk(thesis1.id)
            expect(thesis.programId).toEqual('Testing program')
            expect(thesis.topic).toEqual('test topic')
          })
        })
      })

      describe('when trying to update a thesis with IN_PROGRESS status', () => {
        describe('when the user is an admin', () => {
          it('should return 200 and update the thesis', async () => {
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
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
                {
                  user: user5,
                  isPrimaryGrader: false,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set('hygroupcn', 'grp-toska')
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(response.status).toEqual(200)
          })
        })

        describe("when the user is a manager of the thesis' program", () => {
          it('should return 200 and update the thesis', async () => {
            await ProgramManagement.create({
              programId: 'Testing program',
              userId: user2.id,
            })

            const updatedThesis = {
              programId: 'Testing program',
              studyTrackId: 'new-test-study-track-id',
              topic: 'Updated topic',
              status: 'IN_PROGRESS',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isExternal: false,
                  isPrimarySupervisor: true,
                },
              ],
              graders: [
                {
                  user: user4,
                  isPrimaryGrader: true,
                  isExternal: false,
                },
                {
                  user: user5,
                  isPrimaryGrader: false,
                  isExternal: false,
                },
              ],
              authors: [user2],
            }
            const response = await request
              .put(`/api/theses/${thesis1.id}`)
              .set({ uid: user2.id, hygroupcn: 'hy-employees' })
              .attach(
                'waysOfWorking',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .attach(
                'researchPlan',
                path.resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  './index.ts'
                )
              )
              .field('json', JSON.stringify(updatedThesis))

            expect(response.status).toEqual(200)
          })
        })

        describe('when the user is a manager of a different program', () => {
          describe('when the thesis has PLANNING status', () => {
            it('should return 403 and a correct error message', async () => {
              await ProgramManagement.create({
                programId: 'New program',
                userId: user2.id,
              })

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
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user2.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))

              expect(response.status).toEqual(403)
              expect(response.body).toEqual({
                error:
                  'User is not authorized to change the status of the thesis',
                data: {
                  programId: [
                    'User is not authorized to change the status of the thesis',
                  ],
                },
              })
            })
          })

          describe('when the thesis already has IN_PROGRESS status', () => {
            it('should return 200 and update the thesis', async () => {
              await ProgramManagement.create({
                programId: 'Testing program',
                userId: user2.id,
              })

              const updatedThesis = {
                programId: 'Testing program',
                studyTrackId: 'new-test-study-track-id',
                topic: 'Updated topic',
                status: 'IN_PROGRESS',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: user1,
                    percentage: 100,
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user2.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))

              expect(response.status).toEqual(200)
            })
          })

          describe('when the thesis has status other than PLANING or IN_PROGRESS', () => {
            it('should return 200 and update the thesis', async () => {
              await ProgramManagement.create({
                programId: 'Testing program',
                userId: user2.id,
              })

              thesis1.status = 'CANCELLED'
              thesis1.save()

              const updatedThesis = {
                programId: 'Testing program',
                studyTrackId: 'new-test-study-track-id',
                topic: 'Updated topic',
                status: 'IN_PROGRESS',
                startDate: '1970-01-01T00:00:00.000Z',
                targetDate: '2070-01-01T00:00:00.000Z',
                supervisions: [
                  {
                    user: user1,
                    percentage: 100,
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user2.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))

              expect(response.status).toEqual(200)
            })
          })
        })

        describe('when the user is a teacher and is a supervisor of the thesis', () => {
          describe('when the thesis has PLANNING status', () => {
            it('should return 403 and a correct error message', async () => {
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
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user1.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))
              expect(response.status).toEqual(403)
              expect(response.body).toEqual({
                error:
                  'User is not authorized to change the status of the thesis',
                data: {
                  programId: [
                    'User is not authorized to change the status of the thesis',
                  ],
                },
              })
            })
          })

          describe('when the thesis already has IN_PROGRESS status', () => {
            beforeEach(() => {
              thesis1.status = 'IN_PROGRESS'
              thesis1.save()
            })

            it('should return 200 and update the thesis', async () => {
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
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user1.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))
              expect(response.status).toEqual(200)
            })
          })

          describe('when the thesis has status other than PLANING or IN_PROGRESS', () => {
            beforeEach(() => {
              thesis1.status = 'CANCELLED'
              thesis1.save()
            })

            it('should return 200 and update the thesis', async () => {
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
                    isExternal: false,
                    isPrimarySupervisor: true,
                  },
                ],
                graders: [
                  {
                    user: user4,
                    isPrimaryGrader: true,
                    isExternal: false,
                  },
                  {
                    user: user5,
                    isPrimaryGrader: false,
                    isExternal: false,
                  },
                ],
                authors: [user2],
              }
              const response = await request
                .put(`/api/theses/${thesis1.id}`)
                .set({ uid: user1.id, hygroupcn: 'hy-employees' })
                .attach(
                  'waysOfWorking',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .attach(
                  'researchPlan',
                  path.resolve(
                    dirname(fileURLToPath(import.meta.url)),
                    './index.ts'
                  )
                )
                .field('json', JSON.stringify(updatedThesis))
              expect(response.status).toEqual(200)
            })
          })
        })
      })
    })
  })
})
