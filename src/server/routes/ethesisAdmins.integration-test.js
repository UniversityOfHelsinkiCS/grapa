import supertest from 'supertest'

import { EthesisAdmin, User, Program } from '../db/models'

// Mock the pate mailer to capture email calls
const mockSendEmail = jest.fn()
jest.unstable_mockModule('./src/server/mailer/pate', () => ({
  default: mockSendEmail,
}))

const app = (await import('../index')).default
const request = supertest.agent(app)

describe('ethesis admin router', () => {
  describe('when the user is not an admin', () => {
    describe('GET /api/ethesis-admins', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/ethesis-admins')
        expect(response.status).toEqual(403)
      })
    })

    describe('POST /api/ethesis-admins', () => {
      it('should return 403', async () => {
        const response = await request
          .post('/api/ethesis-admins')
          .send({ userId: 'test-user-id' })
        expect(response.status).toEqual(403)
      })
    })

    describe('DELETE /api/ethesis-admins/:id', () => {
      it('should return 403', async () => {
        const response = await request.delete('/api/ethesis-admins/test-id')
        expect(response.status).toEqual(403)
      })
    })
  })

  describe('when the user is an admin', () => {
    describe('when there are no ethesis admins in the DB', () => {
      describe('GET /api/ethesis-admins', () => {
        it('should return 200 and empty array', async () => {
          const response = await request
            .get('/api/ethesis-admins')
            .set({ hygroupcn: 'grp-toska', uid: 'hy-person-123' })
          expect(response.status).toEqual(200)
          expect(response.body).toEqual([])
        })
      })
    })

    describe('when there are ethesis admins saved in the DB', () => {
      let user1
      let user2
      let ethesisAdmin1
      let ethesisAdmin2

      beforeEach(async () => {
        // Create test users
        user1 = await User.create({
          id: 'test-user-1',
          username: 'testuser1',
          firstName: 'Test',
          lastName: 'User1',
          email: 'test1@example.com',
          language: 'en',
          isAdmin: false,
          hasStudyRight: true,
        })

        user2 = await User.create({
          id: 'test-user-2',
          username: 'testuser2',
          firstName: 'Test',
          lastName: 'User2',
          email: 'test2@example.com',
          language: 'en',
          isAdmin: false,
          hasStudyRight: true,
        })

        // Create test program
        await Program.create({
          id: 'test-program',
          name: {
            fi: 'Testiohjelma',
            en: 'Test Program',
            sv: 'Testprogram',
          },
          level: 'master',
          international: true,
          enabled: true,
        })

        // Create ethesis admins
        ethesisAdmin1 = await EthesisAdmin.create({
          userId: user1.id,
          programId: 'test-program',
        })

        ethesisAdmin2 = await EthesisAdmin.create({
          userId: user2.id,
          programId: null,
        })
      })

      describe('GET /api/ethesis-admins', () => {
        it('should return 200 and all ethesis admins with user details', async () => {
          const response = await request
            .get('/api/ethesis-admins')
            .set({ hygroupcn: 'grp-toska', uid: 'hy-person-123' })

          expect(response.status).toEqual(200)
          expect(response.body).toHaveLength(2)

          const admin1 = response.body.find(
            (admin) => admin.userId === user1.id
          )
          const admin2 = response.body.find(
            (admin) => admin.userId === user2.id
          )

          expect(admin1).toMatchObject({
            id: ethesisAdmin1.id,
            userId: user1.id,
            user: {
              id: user1.id,
              firstName: 'Test',
              lastName: 'User1',
              email: 'test1@example.com',
              username: 'testuser1',
            },
          })

          expect(admin2).toMatchObject({
            id: ethesisAdmin2.id,
            userId: user2.id,
            user: {
              id: user2.id,
              firstName: 'Test',
              lastName: 'User2',
              email: 'test2@example.com',
              username: 'testuser2',
            },
          })
        })
      })

      describe('POST /api/ethesis-admins', () => {
        let newUser

        beforeEach(async () => {
          newUser = await User.create({
            id: 'new-user',
            username: 'newuser',
            firstName: 'New',
            lastName: 'User',
            email: 'new@example.com',
            language: 'en',
            isAdmin: false,
            hasStudyRight: true,
          })
        })

        describe('when creating a new ethesis admin with valid data', () => {
          it('should return 201 and create the ethesis admin', async () => {
            const response = await request
              .post('/api/ethesis-admins')
              .set({ hygroupcn: 'grp-toska', uid: 'hy-person-123' })
              .send({ userId: newUser.id })

            expect(response.status).toEqual(201)
            expect(response.body).toMatchObject({
              userId: newUser.id,
              user: {
                id: newUser.id,
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
                username: 'newuser',
              },
            })

            // Verify the admin was created in the database
            const createdAdmin = await EthesisAdmin.findOne({
              where: { userId: newUser.id },
            })
            expect(createdAdmin).toBeTruthy()
            expect(createdAdmin.userId).toBe(newUser.id)
          })
        })

        describe('when creating an ethesis admin for a user who is already an admin', () => {
          it('should return 409', async () => {
            const response = await request
              .post('/api/ethesis-admins')
              .set({ hygroupcn: 'grp-toska', uid: 'hy-person-123' })
              .send({ userId: user1.id })

            expect(response.status).toEqual(409)
            expect(response.text).toBe('User is already an Ethesis admin')
          })
        })
      })

      describe('DELETE /api/ethesis-admins/:id', () => {
        describe('when deleting an existing ethesis admin', () => {
          it('should return 204 and delete the admin', async () => {
            const response = await request
              .delete(`/api/ethesis-admins/${ethesisAdmin1.id}`)
              .set({ hygroupcn: 'grp-toska', uid: 'hy-person-123' })

            expect(response.status).toEqual(204)

            // Verify the admin was deleted from the database
            const deletedAdmin = await EthesisAdmin.findByPk(ethesisAdmin1.id)
            expect(deletedAdmin).toBeNull()
          })
        })
      })

      describe('email notifications', () => {
        describe('when a thesis status changes from IN_PROGRESS to ETHESIS_SENT', () => {
          it('should send email notifications to ethesis admins', async () => {
            // Clear any previous mock calls
            mockSendEmail.mockClear()

            // Import the handleStatusChangeEmail function
            const { handleStatusChangeEmail } = await import('./thesisHelpers')

            // Create test author user
            const authorUser = await User.create({
              id: 'test-author-for-email',
              username: 'testauthor',
              firstName: 'Test',
              lastName: 'Author',
              email: 'author@example.com',
              studentNumber: '123456789',
              language: 'en',
              isAdmin: false,
              hasStudyRight: true,
            })

            // Create test grader user
            const graderUser = await User.create({
              id: 'test-grader-for-email',
              username: 'testgrader',
              firstName: 'Test',
              lastName: 'Grader',
              email: 'grader@example.com',
              language: 'en',
              isAdmin: false,
              hasStudyRight: true,
            })

            // Create a mock thesis in IN_PROGRESS status
            const originalThesis = {
              id: 'test-thesis-id',
              programId: 'test-program',
              studyTrackId: 'test-study-track',
              topic: 'Test Thesis for Email Notifications',
              status: 'IN_PROGRESS',
              authors: [authorUser],
              graders: [
                {
                  user: graderUser,
                  isPrimaryGrader: true,
                },
              ],
            }

            // Create a mock thesis with ETHESIS_SENT status
            const updatedThesis = {
              ...originalThesis,
              status: 'ETHESIS_SENT',
            }

            // Create a mock action user
            const actionUser = {
              id: 'action-user-id',
              firstName: 'Action',
              lastName: 'User',
            }

            await handleStatusChangeEmail(originalThesis, updatedThesis, actionUser)

            expect(mockSendEmail).toHaveBeenCalledTimes(1)

            const [targets, message, subject] = mockSendEmail.mock.calls[0]

            expect(targets).toEqual(
              expect.arrayContaining([
                'matti.luukkainen@helsinki.fi', // default target
                'test1@example.com', // ethesis admin 1
                'test2@example.com', // ethesis admin 2
              ])
            )
            expect(targets).toHaveLength(3)

            // Verify the email subject and content
            expect(subject).toBe('Prethesis - Tutkielma valmiina Ethesiskseen')
            expect(message).toContain('Test Thesis for Email Notifications')
            expect(message).toContain('Test Author')
            expect(message).toContain('Test Grader')
          })
        })
      })
    })
  })
})
