import supertest from 'supertest'
import app from '../index'
import { Department, DepartmentAdmin, User } from '../db/models'

const request = supertest.agent(app)

describe('department router', () => {
  let user1

  const departments = [
    {
      id: '202ab77b-9c57-4cd0-a560-25dcd5108d6f',
      name: {
        en: 'Department of Chemistry',
        fi: 'Kemian osasto',
        sv: 'Avdelningen för kemi',
      },
    },
    {
      id: '8fdce98e-2e9e-4cd7-a4c3-6d0176e29d37',
      name: {
        en: 'Department of Computer Science',
        fi: 'Tietojenkäsittelytieteen osasto',
        sv: 'Avdelningen för datavetenskap',
      },
    },
    {
      id: '163a5a00-4571-42ac-89a6-7497dee73cbb',
      name: {
        en: 'Department of Geosciences and Geography',
        fi: 'Geotieteiden ja maantieteen osasto',
        sv: 'Avdelningen för geovetenskaper och geografi',
      },
    },
    {
      id: 'c0ce8ca5-6022-471b-a822-5172b1de507d',
      name: {
        en: 'Department of Mathematics and Statistics',
        fi: 'Matematiikan ja tilastotieteen osasto',
        sv: 'Avdelningen för matematik och statistik',
      },
    },
    {
      id: 'ad8a7f5f-2a54-496a-a30e-c0e512508b5d',
      name: {
        en: 'Department of Physics',
        fi: 'Fysiikan osasto',
        sv: 'Avdelningen för fysik',
      },
    },
    {
      id: '305d14cc-6011-4861-b0af-1c9cccb38113',
      name: {
        en: 'Other',
        fi: 'Muu',
        sv: 'Övrig',
      },
    },
  ]

  beforeEach(async () => {
    user1 = await User.create({
      username: 'test1',
      firstName: 'test1',
      lastName: 'test1',
      email: 'test@test.fi',
      language: 'fi',
    })
  })

  describe('when the user is not a teacher', () => {
    describe('GET /api/departments', () => {
      it('should return 403', async () => {
        const res = await request.get('/api/departments')
        expect(res.status).toBe(403)
      })
    })
  })

  describe('when the user is a teacher', () => {
    it('should return 200 and return every department when includeNotManaged is true', async () => {
      // We are seeding the database with the six departments on one of the migrations
      const res = await request
        .get('/api/departments?includeNotManaged=true')
        .set({ uid: user1.id, hygroupcn: 'hy-employees' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.arrayContaining(departments))
    })

    it('should return 200 and return only the managed departments when includeNotManaged is false', async () => {
      // Because teacher is not a department admin, the teacher should not see any departments
      const res = await request
        .get('/api/departments?includeNotManaged=false')
        .set({ uid: user1.id, hygroupcn: 'hy-employees' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe('when the user is an admin', () => {
    it('should return 200 and return every department when includeNotManaged is true', async () => {
      // We are seeding the database with the six departments on one of the migrations
      const res = await request
        .get('/api/departments?includeNotManaged=true')
        .set({ uid: user1.id, hygroupcn: 'grp-toska' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.arrayContaining(departments))
    })

    it('should return 200 and return only the managed departments when includeNotManaged is false', async () => {
      // Because admin is a department admin, the admin should see all departments
      const res = await request
        .get('/api/departments?includeNotManaged=false')
        .set({ uid: user1.id, hygroupcn: 'grp-toska' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.arrayContaining(departments))
    })
  })

  describe('when the user is a department admin', () => {
    let user2
    let department1

    beforeEach(async () => {
      department1 = await Department.findOne()

      user2 = await User.create({
        username: 'test2',
        firstName: 'test2',
        lastName: 'test2',
        email: 'test2@test.fi',
        departmentId: department1.id,
        language: 'fi',
      })

      await DepartmentAdmin.create({
        userId: user2.id,
        departmentId: department1.id,
      })
    })

    it('should return 200 and return every department when includeNotManaged is true', async () => {
      // We are seeding the database with the six departments on one of the migrations
      const res = await request
        .get('/api/departments?includeNotManaged=true')
        .set({ uid: user2.id, hygroupcn: 'hy-employees' })
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.arrayContaining(departments))
    })

    it('should return 200 and return only the managed departments when includeNotManaged is false', async () => {
      const res = await request
        .get('/api/departments?includeNotManaged=false')
        .set({ uid: user2.id, hygroupcn: 'hy-employees' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body).toIncludeSameMembers([
        {
          id: department1.id,
          name: department1.name,
        },
      ])
    })
  })
})
