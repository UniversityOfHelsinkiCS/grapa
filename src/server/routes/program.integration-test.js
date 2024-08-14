import supertest from 'supertest'
import app from '../index'
import { Program, ProgramManagement, StudyTrack, User } from '../db/models'

const request = supertest.agent(app)

describe('program router', () => {
  let user1
  let program1
  let programManagement1

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

    programManagement1 = await ProgramManagement.create({
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

  describe('when the user is not a teacher', () => {
    describe('GET /api/programs', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/programs')
        expect(response.status).toEqual(403)
      })
    })
  })

  describe('when the user is a teacher', () => {
    describe('GET /api/programs', () => {
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
  })

  describe('when the user is an admin', () => {
    describe('GET /api/programs', () => {
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
})
