import supertest from 'supertest'
import app from '../index'
import { User } from '../db/models'

const request = supertest.agent(app)

describe('department router', () => {
  let user1

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
      expect(res.body).toHaveLength(6)
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
      expect(res.body).toHaveLength(6)
    })

    it('should return 200 and return only the managed departments when includeNotManaged is false', async () => {
      // Because admin is a department admin, the admin should see all departments
      const res = await request
        .get('/api/departments?includeNotManaged=false')
        .set({ uid: user1.id, hygroupcn: 'grp-toska' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(6)
    })

  })

  describe('when the user is a department admin', () => {
  
  })
})