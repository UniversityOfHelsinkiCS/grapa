import supertest from 'supertest'
import fs from 'fs'
import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import app from '../index'
import { Attachment, Author, Supervision, Thesis, User } from '../db/models'

const request = supertest(app)

const userAttributesToFetch = [
  'email',
  'firstName',
  'id',
  'lastName',
  'username',
]

describe('thesis router', () => {
  let mockUnlinkSync
  beforeEach(() => {
    mockUnlinkSync = jest.fn()
    fs.unlinkSync = mockUnlinkSync
  })

  describe('when there are no theses', () => {
    describe('GET /api/theses', () => {
      it('should return 200 and an empty array', async () => {
        const response = await request.get('/api/theses').set('hygroupcn', 'grp-toska')
        expect(response.status).toEqual(200)
        expect(response.body).toEqual([])
      })
    })
  })

  describe('when there are theses saved in the DB', () => {
    let user1
    let user2
    let user3
    let thesis1

    beforeEach(async () => {
      await User.create({
        username: 'test1',
        firstName: 'test1',
        lastName: 'test1',
        email: 'test@test.test1',
        language: 'fi',
      })
      await User.create({
        username: 'test2',
        firstName: 'test2',
        lastName: 'test2',
        email: 'test@test.test2',
        language: 'fi',
      })
      await User.create({
        username: 'test3',
        firstName: 'test3',
        lastName: 'test3',
        email: 'test@test.test3',
        language: 'fi',
      })
      user1 = (
        await User.findOne({
          where: { username: 'test1' },
          attributes: userAttributesToFetch,
        })
      ).toJSON()
      user2 = (
        await User.findOne({
          where: { username: 'test2' },
          attributes: userAttributesToFetch,
        })
      ).toJSON()
      user3 = (
        await User.findOne({
          where: { username: 'test3' },
          attributes: userAttributesToFetch,
        })
      ).toJSON()

      thesis1 = await Thesis.create({
        programId: 'Testing program',
        topic: 'test topic',
        status: 'PLANNING',
        startDate: '1970-01-01',
        targetDate: '2070-01-01',
      })
      await Supervision.create({
        userId: user1.id,
        thesisId: thesis1.id,
        percentage: 50,
      })
      await Supervision.create({
        userId: user3.id,
        thesisId: thesis1.id,
        percentage: 50,
      })
      await Author.create({
        userId: user2.id,
        thesisId: thesis1.id,
      })
      await Attachment.create({
        thesisId: thesis1.id,
        label: 'researchPlan',
        filename: 'testfile.pdf1',
        mimetype: 'application/pdf1',
        originalname: 'testfile.pdf1',
      })
      await Attachment.create({
        thesisId: thesis1.id,
        label: 'waysOfWorking',
        filename: 'testfile.pdf2',
        mimetype: 'application/pdf2',
        originalname: 'testfile.pdf2',
      })
    })

    describe('GET /api/theses', () => {
      describe('when the user is an admin', () => {
        it('should return 200 and the theses', async () => {
          const response = await request
            .get('/api/theses')
            .set('hygroupcn', 'grp-toska')
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              programId: 'Testing program',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              authors: [user2],
              researchPlan: {
                filename: 'testfile.pdf1',
                name: 'testfile.pdf1',
                mimetype: 'application/pdf1',
              },
              waysOfWorking: {
                filename: 'testfile.pdf2',
                name: 'testfile.pdf2',
                mimetype: 'application/pdf2',
              },
            },
          ])
          // because the order of supervisions is not guaranteed, we need to check the array length and the content separately to avoid flaky tests
          expect(response.body[0].supervisions).toHaveLength(2)
          expect(response.body[0].supervisions).toContainEqual({
            user: user1,
            percentage: 50,
          })
          expect(response.body[0].supervisions).toContainEqual({
            user: user3,
            percentage: 50,
          })
        })
      })

      describe('when the user is a teacher and is a supervisor of the thesis', () => {
        it('should return 200 and the theses', async () => {
          const response = await request
            .get('/api/theses')
            .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              programId: 'Testing program',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              authors: [user2],
              researchPlan: {
                filename: 'testfile.pdf1',
                name: 'testfile.pdf1',
                mimetype: 'application/pdf1',
              },
              waysOfWorking: {
                filename: 'testfile.pdf2',
                name: 'testfile.pdf2',
                mimetype: 'application/pdf2',
              },
            },
          ])
          // because the order of supervisions is not guaranteed, we need to check the array length and the content separately to avoid flaky tests
          expect(response.body[0].supervisions).toHaveLength(2)
          expect(response.body[0].supervisions).toContainEqual({
            user: user1,
            percentage: 50,
          })
          expect(response.body[0].supervisions).toContainEqual({
            user: user3,
            percentage: 50,
          })
        })
      })

      describe('when the user is a teacher and is not a supervisor of the thesis', () => {
        it('should return 200 and the theses', async () => {
          const response = await request
            .get('/api/theses')
            .set({ uid: 'test-id-of-not-supervisor', hygroupcn: 'hy-employees' })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([])
        })
      })
    })

    describe('DELETE /api/theses/:id', () => {
      it('should return 204 and delete the thesis', async () => {
        const response = await request.delete(`/api/theses/${thesis1.id}`).set('hygroupcn', 'grp-toska')
        expect(response.status).toEqual(204)
        const thesis = await Thesis.findByPk(thesis1.id)
        expect(thesis).toBeNull()

        expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
        expect(fs.unlinkSync).toHaveBeenCalledWith(
          '/opt/app-root/src/uploads/testfile.pdf1'
        )
        expect(fs.unlinkSync).toHaveBeenCalledWith(
          '/opt/app-root/src/uploads/testfile.pdf2'
        )
      })
    })

    describe('POST /api/theses', () => {
      it('should return 201 and create a new thesis', async () => {
        const newThesis = {
          programId: 'New program',
          topic: 'New topic',
          status: 'PLANNING',
          startDate: '1970-01-01T00:00:00.000Z',
          targetDate: '2070-01-01T00:00:00.000Z',
          supervisions: [
            {
              user: user1,
              percentage: 100,
            },
          ],
          authors: [user2],
        }
        const response = await request
          .post('/api/theses')
          .set('hygroupcn', 'grp-toska')
          .attach(
            'waysOfWorking',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .attach(
            'researchPlan',
            path.resolve(dirname(fileURLToPath(import.meta.url)), './index.ts')
          )
          .field('json', JSON.stringify(newThesis))
        expect(response.status).toEqual(201)

        delete newThesis.supervisions
        delete newThesis.authors
        expect(response.body).toMatchObject(newThesis)

        const thesis = await Thesis.findByPk(response.body.id)
        expect(thesis).not.toBeNull()
      })
    })

    describe('PUT /api/theses/:id', () => {
      describe('when both attachments are updated', () => {
        it('should return 200 and update the thesis', async () => {
          const updatedThesis = {
            programId: 'Updated program',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
              },
            ],
            authors: [user2],
          }
          const response = await request
            .put(`/api/theses/${thesis1.id}`)
            .set('hygroupcn', 'grp-toska')
            .attach(
              'waysOfWorking',
              path.resolve(
                dirname(fileURLToPath(import.meta.url)),
                './index.ts'
              )
            )
            .attach(
              'researchPlan',
              path.resolve(
                dirname(fileURLToPath(import.meta.url)),
                './index.ts'
              )
            )
            .field('json', JSON.stringify(updatedThesis))

          expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
          expect(fs.unlinkSync).toHaveBeenCalledWith(
            '/opt/app-root/src/uploads/testfile.pdf1'
          )
          expect(fs.unlinkSync).toHaveBeenCalledWith(
            '/opt/app-root/src/uploads/testfile.pdf2'
          )

          expect(response.status).toEqual(200)
          delete updatedThesis.supervisions
          delete updatedThesis.authors
          expect(response.body).toMatchObject(updatedThesis)

          const thesis = await Thesis.findByPk(thesis1.id)
          expect(thesis.programId).toEqual('Updated program')
          expect(thesis.topic).toEqual('Updated topic')
        })
      })

      describe('when one attachment is updated and another stays the same', () => {
        it('should return 200 and update the thesis', async () => {
          const updatedThesis = {
            programId: 'Updated program',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
              },
            ],
            authors: [user2],
            waysOfWorking: {
              filename: 'testfile.pdf2',
              name: 'testfile.pdf2',
              mimetype: 'application/pdf2',
            },
          }
          const response = await request
            .put(`/api/theses/${thesis1.id}`)
            .set('hygroupcn', 'grp-toska')
            .attach(
              'researchPlan',
              path.resolve(
                dirname(fileURLToPath(import.meta.url)),
                './index.ts'
              )
            )
            .field('json', JSON.stringify(updatedThesis))

          expect(fs.unlinkSync).toHaveBeenCalledTimes(1)
          expect(fs.unlinkSync).toHaveBeenCalledWith(
            '/opt/app-root/src/uploads/testfile.pdf1'
          )

          expect(response.status).toEqual(200)
          delete updatedThesis.supervisions
          delete updatedThesis.authors
          delete updatedThesis.waysOfWorking
          expect(response.body).toMatchObject(updatedThesis)

          const thesis = await Thesis.findByPk(thesis1.id)
          expect(thesis.programId).toEqual('Updated program')
          expect(thesis.topic).toEqual('Updated topic')
        })
      })

      describe('when neither of the attachments are updated', () => {
        it('should return 200 and update the thesis', async () => {
          const updatedThesis = {
            programId: 'Updated program',
            topic: 'Updated topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                user: user1,
                percentage: 100,
              },
            ],
            authors: [user2],
            waysOfWorking: {
              filename: 'testfile.pdf2',
              name: 'testfile.pdf2',
              mimetype: 'application/pdf2',
            },
            researchPlan: {
              filename: 'testfile.pdf1',
              name: 'testfile.pdf1',
              mimetype: 'application/pdf1',
            },
          }
          const response = await request
            .put(`/api/theses/${thesis1.id}`)
            .set('hygroupcn', 'grp-toska')
            .field('json', JSON.stringify(updatedThesis))

          expect(fs.unlinkSync).toHaveBeenCalledTimes(0)

          expect(response.status).toEqual(200)
          delete updatedThesis.supervisions
          delete updatedThesis.authors
          delete updatedThesis.waysOfWorking
          delete updatedThesis.researchPlan
          expect(response.body).toMatchObject(updatedThesis)

          const thesis = await Thesis.findByPk(thesis1.id)
          expect(thesis.programId).toEqual('Updated program')
          expect(thesis.topic).toEqual('Updated topic')
        })
      })
    })
  })
})
