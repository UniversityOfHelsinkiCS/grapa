import supertest from 'supertest'
import app from '../index'
import { Department, DepartmentAdmin, User } from '../db/models'

const request = supertest.agent(app)

describe('department-admins router', () => {
  let user1
  let user2
  let user3
  let department1
  let department2
  let departmentAdmin1
  let departmentAdmin2

  beforeEach(async () => {
    department1 = await Department.create({
      name: { fi: 'test1suomeksi', en: 'test1inenglish', sv: 'test1pasvenska' },
    })
    department2 = await Department.create({
      name: { fi: 'test2suomeksi', en: 'test2inenglish', sv: 'test2pasvenska' },
    })

    user1 = await User.create({
      username: 'test1',
      firstName: 'test1',
      lastName: 'test1',
      email: 'test@test.fi',
      language: 'fi',
    })
    user2 = await User.create({
      username: 'test2',
      firstName: 'test2',
      lastName: 'test2',
      email: 'test@test.test2',
      language: 'fi',
    })
    user3 = await User.create({
      username: 'test3',
      firstName: 'test3',
      lastName: 'test3',
      email: 'test@test.test3',
      language: 'fi',
    })

    departmentAdmin1 = await DepartmentAdmin.create({
      departmentId: department1.id,
      userId: user1.id,
    })

    departmentAdmin2 = await DepartmentAdmin.create({
      departmentId: department2.id,
      userId: user2.id,
    })
  })

  describe('when the user is not a teacher', () => {
    describe('GET /api/department-admins', () => {
      it('should return 403', async () => {
        const res = await request.get('/api/department-admins')
        expect(res.status).toBe(403)
      })
    })

    describe('POST /api/department-admins', () => {
      it('should return 403', async () => {
        const res = await request.post('/api/department-admins').send({
          departmentId: department1.id,
          userId: user3.id,
        })
        expect(res.status).toBe(403)
      })
    })

    describe('DELETE /api/department-admins/:id', () => {
      it('should return 403', async () => {
        const res = await request.delete(`/api/department-admins/${departmentAdmin1.id}`)
        expect(res.status).toBe(403)
      })
    })
  })

  describe('when the user is a teacher', () => {
    describe('GET /api/department-admins', () => {
      it('should return 200', async () => {
        const res = await request
          .get('/api/department-admins')
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject([])
      })
    })

    describe('POST /api/department-admins', () => {
      it('should return 403', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: department1.id,
            userId: user3.id,
          })
        expect(res.status).toBe(403)
      })
    })

    describe('DELETE /api/department-admins/:id', () => {
      it('should return 403', async () => {
        const res = await request
          .delete(`/api/department-admins/${departmentAdmin1.id}`)
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(403)
      })
    })
  })
  
  describe('when the user is an admin', () => {
    describe('GET /api/department-admins', () => {
      it('should return 200', async () => {
        const res = await request
          .get('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
        expect(res.status).toBe(200)
        expect(res.body).toIncludeSameMembers([
          {
            id: departmentAdmin1.id,
            departmentId: department1.id,
            userId: user1.id,
            user: expect.any(Object),
            department: expect.any(Object),
          },
          {
            id: departmentAdmin2.id,
            departmentId: department2.id,
            userId: user2.id,
            user: expect.any(Object),
            department: expect.any(Object),
          },
        ])
      })
    })

    describe('POST /api/department-admins', () => {
      it('should return 200', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            departmentId: department2.id,
            userId: user3.id,
          })
        expect(res.status).toBe(201)
        expect(res.body).toMatchObject({
          departmentId: department2.id,
          userId: user3.id,
        })
      })
    })

    describe('DELETE /api/department-admins/:id', () => {
      it('should return 204', async () => {
        const res = await request
          .delete(`/api/department-admins/${departmentAdmin1.id}`)
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
        expect(res.status).toBe(204)
      })
    })
  })
})