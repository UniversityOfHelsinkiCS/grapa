import supertest from 'supertest'
import app from '../index'
import { Program, StudyTrack } from '../db/models'

const request = supertest.agent(app)

describe('program router', () => {
  beforeEach(async () => {
    await Program.create({
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
            .set('hygroupcn', 'hy-employees')
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
              ])
            },
          ])
        })
      })

      describe('when includeDisabled===false is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set('hygroupcn', 'hy-employees')
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
              ])
            },
          ])
        })
      })

      describe('when includeDisabled===true is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set('hygroupcn', 'hy-employees')
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
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }), 
              ])
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test3' }),
                expect.objectContaining({ name: 'test4' }), 
              ])
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
            .set('hygroupcn', 'grp-toska')
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
              ])
            },
          ])
        })
      })

      describe('when includeDisabled===false is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set('hygroupcn', 'grp-toska')
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
              ])
            },
          ])
        })
      })

      describe('when includeDisabled===true is passed', () => {
        it('should return 200 and all enabled programs', async () => {
          const response = await request
            .get('/api/programs')
            .set('hygroupcn', 'grp-toska')
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
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test1' }),
                expect.objectContaining({ name: 'test2' }), 
              ])
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              studyTracks: expect.toIncludeSameMembers([
                expect.objectContaining({ name: 'test3' }),
                expect.objectContaining({ name: 'test4' }), 
              ])
            },
          ])
        })
      })
    })
  })
})
