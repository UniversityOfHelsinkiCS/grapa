import supertest from 'supertest'
import fs from 'fs'
import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import app from '../index'
import { Attachment, Author, Supervision, Thesis, User } from '../db/models'

const request = supertest(app)

describe('thesis router', () => {
  let mockUnlinkSync
  beforeEach(() => {
    mockUnlinkSync = jest.fn()
    fs.unlinkSync = mockUnlinkSync
  })

  describe('when there are no theses', () => {
    describe('GET /api/theses', () => {
      it('should return 200 and an empty array', async () => {
        const response = await request.get('/api/theses')
        expect(response.status).toEqual(200)
        expect(response.body).toEqual([])
      })
    })
  })

  describe('when there are theses saved in the DB', () => {
    let user1
    let user2
    let thesis1

    beforeEach(async () => {
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
        percentage: 100,
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
      it('should return 200 and the theses correctly associated with users and attachments', async () => {
        const response = await request.get('/api/theses')
        expect(response.status).toEqual(200)
        expect(response.body).toMatchObject([
          {
            programId: 'Testing program',
            topic: 'test topic',
            status: 'PLANNING',
            startDate: '1970-01-01T00:00:00.000Z',
            targetDate: '2070-01-01T00:00:00.000Z',
            supervisions: [
              {
                userId: user1.id,
                percentage: 100,
              },
            ],
            authors: [
              {
                userId: user2.id,
              },
            ],
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
      })
    })

    describe('DELETE /api/theses/:id', () => {
      it('should return 204 and delete the thesis', async () => {
        const response = await request.delete(`/api/theses/${thesis1.id}`)
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
              userId: user1.id,
              percentage: 100,
            },
          ],
          authors: [
            {
              userId: user2.id,
            },
          ],
        }
        const response = await request
          .post('/api/theses')
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
                userId: user1.id,
                percentage: 100,
              },
            ],
            authors: [
              {
                userId: user2.id,
              },
            ],
          }
          const response = await request
            .put(`/api/theses/${thesis1.id}`)
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
                userId: user1.id,
                percentage: 100,
              },
            ],
            authors: [
              {
                userId: user2.id,
              },
            ],
            waysOfWorking: {
              filename: 'testfile.pdf2',
              name: 'testfile.pdf2',
              mimetype: 'application/pdf2',
            },
          }
          const response = await request
            .put(`/api/theses/${thesis1.id}`)
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
      });

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
                userId: user1.id,
                percentage: 100,
              },
            ],
            authors: [
              {
                userId: user2.id,
              },
            ],
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
