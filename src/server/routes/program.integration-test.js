import supertest from 'supertest'
import app from '../index'
import { Program } from '../db/models'

const request = supertest(app)

describe('program router', () => {
  beforeEach(async () => {
    await await Program.create({
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
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
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
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
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
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              level: 'master',
              international: false,
              companionFaculties: [],
              enabled: false,
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
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
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
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
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
          expect(response.body).toMatchObject([
            {
              id: 'test1',
              name: {
                fi: 'test1suomeksi',
                en: 'test1inenglish',
                sv: 'test1pasvenska',
              },
              level: 'master',
              international: true,
              companionFaculties: [],
              enabled: true,
            },
            {
              id: 'test2',
              name: {
                fi: 'test2suomeksi',
                en: 'test2inenglish',
                sv: 'test2pasvenska',
              },
              level: 'master',
              international: false,
              companionFaculties: [],
              enabled: false,
            },
          ])
        })
      })
    })
  })
})
