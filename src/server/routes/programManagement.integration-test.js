import supertest from 'supertest'
import app from '../index'
import { Program, ProgramManagement, User } from '../db/models'

const request = supertest.agent(app)

describe('program-managements router', () => {
  let user1
  let user2
  let user3
  let program1
  let program2
  let programManagement1
  let programManagement2

  beforeEach(async () => {
    program1 = await Program.create({
      id: 'test1',
      name: { fi: 'test1suomeksi', en: 'test1inenglish', sv: 'test1pasvenska' },
      level: 'master',
      international: true,
      companionFaculties: [],
      enabled: true,
    })
    program2 = await Program.create({
      id: 'test2',
      name: { fi: 'test2suomeksi', en: 'test2inenglish', sv: 'test2pasvenska' },
      level: 'master',
      international: true,
      companionFaculties: [],
      enabled: true,
    })

    user1 = await User.create({
      username: 'test1',
      firstName: 'test1',
      lastName: 'test1',
      email: 'test@test.test1',
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

    programManagement1 = await ProgramManagement.create({
      programId: program2.id,
      userId: user2.id,
    })
    programManagement2 = await ProgramManagement.create({
      programId: program1.id,
      userId: user3.id,
      isThesisApprover: true,
    })
  })

  describe('when the user is not a teacher', () => {
    describe('GET /api/program-managements', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/program-managements')
        expect(response.status).toEqual(403)
      })
    })

    describe('POST /api/program-managements', () => {
      it('should return 403', async () => {
        const response = await request.post('/api/program-managements').send({
          programId: 'test1',
          userId: 'test1',
        })
        expect(response.status).toEqual(403)
      })
    })

    describe('DELETE /api/program-managements', () => {
      it('should return 403', async () => {
        const response = await request.delete(
          `/api/program-managements/${programManagement1.id}`
        )
        expect(response.status).toEqual(403)
      })
    })

    describe('PUT /api/program-managements', () => {
      it('should return 403', async () => {
        const response = await request.put(
          `/api/program-managements/${programManagement1.id}`
        )
        expect(response.status).toEqual(403)
      })
    })
  })

  describe('when the user is a teacher', () => {
    describe('GET /api/program-managements', () => {
      it('should return 200', async () => {
        const response = await request
          .get('/api/program-managements?limitToEditorsPrograms=true')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(200)
        expect(response.body).toMatchObject([])
      })
    })

    describe('POST /api/program-managements', () => {
      it('should return 404', async () => {
        const response = await request
          .post('/api/program-managements')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            programId: 'test1',
            userId: 'test1',
          })
        expect(response.status).toEqual(403)
      })
    })

    describe('DELETE /api/program-managements', () => {
      it('should return 404', async () => {
        const response = await request
          .delete(`/api/program-managements/${programManagement1.id}`)
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(404)
      })
    })

    describe('PUT /api/program-managements', () => {
      it('should return 404', async () => {
        const response = await request
          .put(`/api/program-managements/${programManagement1.id}`)
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(404)
      })
    })
  })

  describe('when the user is an admin', () => {
    describe('GET /api/program-managements', () => {
      describe('when no query params are passed', () => {
        it('should return 200 and the correct response', async () => {
          const response = await request
            .get('/api/program-managements')
            .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: programManagement1.id,
              programId: programManagement1.programId,
              isThesisApprover: programManagement1.isThesisApprover,
              userId: programManagement1.userId,
              user: expect.any(Object),
              program: expect.any(Object),
            },
            {
              id: programManagement2.id,
              programId: programManagement2.programId,
              isThesisApprover: programManagement2.isThesisApprover,
              userId: programManagement2.userId,
              user: expect.any(Object),
              program: expect.any(Object),
            },
          ])
        })
      })

      describe('when programId query param is passed', () => {
        it('should return 200 and the correct response', async () => {
          const response = await request
            .get(
              `/api/program-managements?programId=${programManagement1.programId}`
            )
            .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: programManagement1.id,
              programId: programManagement1.programId,
              isThesisApprover: programManagement1.isThesisApprover,
              userId: programManagement1.userId,
              user: expect.any(Object),
              program: expect.any(Object),
            },
          ])
        })
      })

      describe('when onlyThesisApprovers query param is passed', () => {
        it('should return 200 and the correct response', async () => {
          const response = await request
            .get(`/api/program-managements?onlyThesisApprovers=true`)
            .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([
            {
              id: programManagement2.id,
              programId: programManagement2.programId,
              isThesisApprover: programManagement2.isThesisApprover,
              userId: programManagement2.userId,
              user: expect.any(Object),
              program: expect.any(Object),
            },
          ])
        })
      })

      describe('when onlyThesisApprovers and programId query params are passed', () => {
        it('should return 200 and the correct response', async () => {
          const response = await request
            .get(`/api/program-managements?onlyThesisApprovers=true&programId=${programManagement1.programId}`)
            .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          expect(response.status).toEqual(200)
          expect(response.body).toIncludeSameMembers([])
        })
      })
    })

    describe('POST /api/program-managements', () => {
      it('should return 404', async () => {
        const response = await request
          .post('/api/program-managements')
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            programId: program1.id,
            userId: user1.id,
          })
        expect(response.status).toEqual(201)
        expect(response.body).toMatchObject({
          programId: program1.id,
          userId: user1.id,
        })

        expect(
          await ProgramManagement.findOne({
            where: { programId: program1.id, userId: user1.id },
          })
        ).toMatchObject({
          programId: program1.id,
          userId: user1.id,
        })
      })
    })

    describe('DELETE /api/program-managements', () => {
      it('should return 204 and delete the row', async () => {
        const response = await request
          .delete(`/api/program-managements/${programManagement1.id}`)
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
        expect(response.status).toEqual(204)
        expect(
          await ProgramManagement.findOne({
            where: { id: programManagement1.id },
          })
        ).toBeNull()
      })
    })

    describe('PUT /api/program-managements', () => {
      it('should return 200 and delete the row', async () => {
        const response = await request
          .put(`/api/program-managements/${programManagement1.id}`)
          .set({ uid: user1.id, hygroupcn: 'grp-toska' })
          .send({
            isThesisApprover: true,
          })
        expect(response.status).toEqual(200)
        expect(
          (await ProgramManagement.findByPk(programManagement1.id))
            .isThesisApprover
        ).toEqual(true)
      })
    })
  })

  describe('when the user is a teacher and is managing program 1', () => {
    let programThatTheUserCanManage
    beforeEach(async () => {
      programThatTheUserCanManage = await ProgramManagement.create({
        programId: program1.id,
        userId: user1.id,
      })
    })

    describe('GET /api/program-managements', () => {
      it('should return 200 and only the programs that teacher is managing', async () => {
        const response = await request
          .get('/api/program-managements?limitToEditorsPrograms=true')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(200)
        expect(response.body).toIncludeSameMembers([
          {
            id: programThatTheUserCanManage.id,
            programId: programThatTheUserCanManage.programId,
            userId: programThatTheUserCanManage.userId,
            isThesisApprover: programThatTheUserCanManage.isThesisApprover,
            user: expect.any(Object),
            program: expect.any(Object),
          },
          {
            id: programManagement2.id,
            programId: programManagement2.programId,
            userId: programManagement2.userId,
            isThesisApprover: programManagement2.isThesisApprover,
            user: expect.any(Object),
            program: expect.any(Object),
          },
        ])
      })
    })

    describe('POST /api/program-managements', () => {
      it('should return 200 when creating ProgramManagement for a program the user can manage', async () => {
        const response = await request
          .post('/api/program-managements')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            programId: programThatTheUserCanManage.programId,
            userId: user2.id,
          })
        expect(response.status).toEqual(201)
        expect(response.body).toMatchObject({
          programId: programThatTheUserCanManage.programId,
          userId: user2.id,
        })
        expect(
          await ProgramManagement.findOne({
            where: {
              programId: programThatTheUserCanManage.programId,
              userId: user2.id,
            },
          })
        ).toMatchObject({
          programId: programThatTheUserCanManage.programId,
          userId: user2.id,
        })
      })

      it('should return 403 when creating ProgramManagement for a program the user cannot manage', async () => {
        const response = await request
          .post('/api/program-managements')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          .send({
            programId: program2.id,
            userId: user3.id,
          })
        expect(response.status).toEqual(403)
        expect(
          await ProgramManagement.findOne({
            where: {
              programId: program2.id,
              userId: user3.id,
            },
          })
        ).toBeNull()
      })
    })

    describe('DELETE /api/program-managements', () => {
      it('should return 204 when deleting ProgramManagement for a program the user can manage', async () => {
        const response = await request
          .delete(`/api/program-managements/${programThatTheUserCanManage.id}`)
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(204)
        expect(
          await ProgramManagement.findByPk(programThatTheUserCanManage.id)
        ).toBeNull()
      })

      it('should return 404 when trying to delete ProgramManagement for a program the user does not manage', async () => {
        const response = await request
          .delete(`/api/program-managements/${programManagement1.id}`)
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(404)
        expect(
          await ProgramManagement.findByPk(programManagement1.id)
        ).not.toBeNull()
      })
    })

    describe('PUT /api/program-managements', () => {
      it('should return 200 when updating ProgramManagement for a program the user can manage', async () => {
        const response = await request
          .put(`/api/program-managements/${programThatTheUserCanManage.id}`)
          .send({ isThesisApprover: true })
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(200)
        expect(
          (await ProgramManagement.findByPk(programThatTheUserCanManage.id))
            .isThesisApprover
        ).toEqual(true)
      })

      it('should return 404 when trying to update ProgramManagement for a program the user does not manage', async () => {
        const response = await request
          .delete(`/api/program-managements/${programManagement1.id}`)
          .send({ isThesisApprover: true })
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(404)
        expect(
          (await ProgramManagement.findByPk(programThatTheUserCanManage.id))
            .isThesisApprover
        ).toEqual(false)
      })
    })
  })
})
