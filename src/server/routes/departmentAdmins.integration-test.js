import supertest from 'supertest'
import app from '../index'
import { Thesis, Supervision, Program, StudyTrack, Department, DepartmentAdmin, User } from '../db/models'

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
      departmentId: department1.id,
    })
    user2 = await User.create({
      username: 'test2',
      firstName: 'test2',
      lastName: 'test2',
      email: 'test@test.test2',
      language: 'fi',
      departmentId: department2.id,
    })
    user3 = await User.create({
      username: 'test3',
      firstName: 'test3',
      lastName: 'test3',
      email: 'test@test.test3',
      language: 'fi',
      departmentId: department1.id,
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

    describe('GET /api/department-admins/statistics', () => {
      it('should return 403', async () => {
        const res = await request.get('/api/department-admins/statistics')
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
        const res = await request.delete(`/api/department-admins/${departmentAdmin1.id}`).send({
          departmentId: department1.id,
          userId: user3.id,
        })
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

    describe('GET /api/department-admins/statistics', () => {
      it('should return 403 when the user is not a department admin', async () => {
        const res = await request.get('/api/department-admins/statistics').set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(403)
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

      it('should return 400 when there is no departmentId', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            userId: user3.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when there is no userId', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            departmentId: department2.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when the departmentId is not a valid UUID', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            departmentId: 'invalid-uuid',
            userId: user3.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when the user is already a specified department admin', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            departmentId: department1.id,
            userId: user1.id,
          })
        expect(res.status).toBe(400)
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

  describe('when the user is a department admin', () => {
    let departmentAdmin3
    beforeEach(async () => {
      departmentAdmin3 = await DepartmentAdmin.create({
        departmentId: department1.id,
        userId: user3.id,
      })
    })

    describe('GET /api/department-admins', () => {
      it('should return 200 and the department admins that the teacher is also part of', async () => {
        const res = await request
          .get('/api/department-admins')
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
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
            id: departmentAdmin3.id,
            departmentId: department1.id,
            userId: user3.id,
            user: expect.any(Object),
            department: expect.any(Object),
          },
        ])
      })
    })

    describe('GET /api/department-admins/statistics', () => {
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

        await StudyTrack.create({
          id: 'test-study-track-id',
          programId: 'Testing program',
          name: {
            fi: 'Test study track',
            en: 'Test study track',
            sv: 'Test study track',
          },
        })

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
          userId: user2.id,
          thesisId: thesis1.id,
          percentage: 50,
          isPrimarySupervisor: false,
        })
      })

      it('should return 200 and the statistics of the department admins', async () => {
        const res = await request.get('/api/department-admins/statistics').set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(200)
        expect(res.body).toIncludeSameMembers([
          {
            department: {
              id: department1.id,
              name: department1.name,
            },
            supervisor: {
              id: user1.id,
              username: user1.username,
              firstName: user1.firstName,
              lastName: user1.lastName,
              email: user1.email,
              departmentId: user1.departmentId,
            },
            statusCounts: {
              PLANNING: 1,
              IN_PROGRESS: 0,
              COMPLETED: 0,
              CANCELLED: 0,
            },
          },
        ])
      })
    })

    describe('POST /api/department-admins', () => {
      it('should return 200 when adding a department admin to the same department', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: department1.id,
            userId: user2.id,
          })
        expect(res.status).toBe(201)
        expect(res.body).toMatchObject({
          departmentId: department1.id,
          userId: user2.id,
        })
      })

      it('should return 400 when there is no departmentId', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            userId: user3.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when there is no userId', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: department2.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when the departmentId is not a valid UUID', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: 'invalid-uuid',
            userId: user3.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 400 when the user is already a specified department admin', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: department1.id,
            userId: user1.id,
          })
        expect(res.status).toBe(400)
      })

      it('should return 403 when trying to add a department admin to another department', async () => {
        const res = await request
          .post('/api/department-admins')
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
          .send({
            departmentId: department2.id,
            userId: user2.id,
          })
        expect(res.status).toBe(403)
      })
    })

    describe('DELETE /api/department-admins/:id', () => {
      it('should return 204 when deleting self from the department admins', async () => {
        const res = await request
          .delete(`/api/department-admins/${departmentAdmin3.id}`)
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(204)
      })

      it('should return 404 when trying to delete a department admin from another department', async () => {
        const res = await request
          .delete(`/api/department-admins/${departmentAdmin2.id}`)
          .set({ uid: user3.id, hygroupcn: 'hy-employees' })
        expect(res.status).toBe(404)
      })
    })
  
  })
})