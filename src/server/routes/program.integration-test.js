import supertest from 'supertest'
import app from '../index'
import {
  EventLog,
  Program,
  ProgramManagement,
  StudyTrack,
  Thesis,
  User,
} from '../db/models'

const request = supertest.agent(app)

describe('program router', () => {
  let user1
  let program1

  beforeEach(async () => {
    user1 = await User.create({
      username: 'test1',
      firstName: 'test1',
      lastName: 'test1',
      email: 'test@test.test1',
      language: 'fi',
    })

    program1 = await Program.create({
      id: 'test1',
      name: { fi: 'test1suomeksi', en: 'test1inenglish', sv: 'test1pasvenska' },
      level: 'master',
      international: true,
      companionFaculties: [],
      enabled: true,
    })

    await Program.create({
      id: 'test2',
      name: { fi: 'test2suomeksi', en: 'test2inenglish', sv: 'test2pasvenska' },
      level: 'master',
      international: false,
      companionFaculties: [],
      enabled: false,
    })

    await ProgramManagement.create({
      programId: program1.id,
      userId: user1.id,
    })

    await StudyTrack.create({
      name: 'test1',
      programId: 'test1',
    })
    await StudyTrack.create({
      name: 'test2',
      programId: 'test1',
    })
    await StudyTrack.create({
      name: 'test3',
      programId: 'test2',
    })
    await StudyTrack.create({
      name: 'test4',
      programId: 'test2',
    })
  })

  describe('GET /api/programs', () => {
    describe('when the user is not a teacher', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/programs')
        expect(response.status).toEqual(403)
      })
    })

    describe('when the user is a teacher', () => {
      describe('when includeDisabled is not passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===false is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ includeDisabled: false })

          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===true and includeNotManaged is omitted', () => {
        it('should return 200 and only managed thesis', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ includeDisabled: true })

          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===true and includeNotManaged===false', () => {
        it('should return 200 and only managed thesis', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ includeDisabled: true, includeNotManaged: false })

          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===true and includeNotManaged===true', () => {
        it('should return 200 and all enabled theses', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ includeDisabled: true, includeNotManaged: true })

          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test3' }),
                expect.objectContaining({ name: 'test4' }),
              ]),
            },
          ])
        })
      })
    })

    describe('when the user is an admin', () => {
      describe('when includeDisabled is not passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'grp-toska', uid: user1.id })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===false is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'grp-toska', uid: user1.id })
            .query({ includeDisabled: false })

          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
          ])
        })
      })

      describe('when includeDisabled===true is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set({ hygroupcn: 'grp-toska', uid: user1.id })
            .query({ includeDisabled: true })

          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }),
              ]),
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              isFavorite: false,
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test3' }),
                expect.objectContaining({ name: 'test4' }),
              ]),
            },
          ])
        })
      })
    })
  })

  describe('GET /api/programs/:id/event-log', () => {
    let user2, adminUser, thesis1, thesis2, program2
    beforeEach(async () => {
      user2 = await User.create({
        username: 'test2',
        firstName: 'test2',
        lastName: 'test2',
        email: 'test@test.test2',
        language: 'fi',
      })

      adminUser = await User.create({
        username: 'admin',
        firstName: 'admin',
        lastName: 'admin',
        email: 'admin@test.test',
        language: 'fi',
        isAdmin: true,
      })

      thesis1 = await Thesis.create({
        programId: program1.id,
        topic: 'test topic',
        status: 'PLANNING',
        startDate: '1970-01-01',
        targetDate: '2070-01-01',
      })

      program2 = await Program.create({
        id: 'another-program',
        name: {
          fi: 'test2suomeksi',
          en: 'test2inenglish',
          sv: 'test2pasvenska',
        },
        level: 'master',
        international: false,
        companionFaculties: [],
        enabled: false,
      })

      thesis2 = await Thesis.create({
        programId: program2.id,
        topic: 'test topic',
        status: 'PLANNING',
        startDate: '1970-01-01',
        targetDate: '2070-01-01',
      })

      await EventLog.create({
        thesisId: thesis1.id,
        type: 'THESIS_STATUS_CHANGED',
        userId: user1.id,
      })
      await EventLog.create({
        thesisId: thesis2.id,
        type: 'THESIS_STATUS_CHANGED',
        userId: user1.id,
      })
    })

    describe('when the user is an admin', () => {
      it('should return 200 and the event log for the specified program', async () => {
        const response = await request
          .get(`/api/programs/${program1.id}/event-log`)
          .set({ hygroupcn: 'grp-toska', uid: adminUser.id })

        expect(response.status).toEqual(200)
        expect(response.body).toHaveLength(1)
        expect(response.body[0]).toMatchObject({
          thesisId: thesis1.id,
          type: 'THESIS_STATUS_CHANGED',
        })
      })
    })

    describe('when the user is a program manager', () => {
      it('should return 200 and the event log for the specified program', async () => {
        const response = await request
          .get(`/api/programs/${program1.id}/event-log`)
          .set({ hygroupcn: 'hy-employees', uid: user1.id })

        expect(response.status).toEqual(200)
        expect(response.body).toHaveLength(1)
        expect(response.body[0]).toMatchObject({
          thesisId: thesis1.id,
          type: 'THESIS_STATUS_CHANGED',
        })
      })
    })

    describe('when the user is not a program manager nor admin', () => {
      it('should return 403', async () => {
        const response = await request
          .get(`/api/programs/${program1.id}/event-log`)
          .set({ hygroupcn: 'hy-employees', uid: user2.id })

        expect(response.status).toEqual(403)
      })
    })

    describe('nonAdminOnly query param', () => {
      beforeEach(async () => {
        // create event logs that are created by admin users
        await EventLog.create({
          thesisId: thesis1.id,
          type: 'THESIS_STATUS_CHANGED',
          userId: adminUser.id,
        })
      })

      describe('when nonAdminOnly is true', () => {
        it('should return 200 and only the event logs for the specified program that were created by non-admin users', async () => {
          const response = await request
            .get(`/api/programs/${program1.id}/event-log`)
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ nonAdminOnly: true })

          expect(response.status).toEqual(200)
          expect(response.body).toHaveLength(1)
          expect(response.body[0]).toMatchObject({
            thesisId: thesis1.id,
            type: 'THESIS_STATUS_CHANGED',
          })
        })
      })

      describe('when nonAdminOnly is false', () => {
        it('should return 200 and all event logs for the specified program', async () => {
          const response = await request
            .get(`/api/programs/${program1.id}/event-log`)
            .set({ hygroupcn: 'hy-employees', uid: user1.id })
            .query({ nonAdminOnly: false })

          expect(response.status).toEqual(200)
          expect(response.body).toHaveLength(2)
        })
      })
    })
  })
})
