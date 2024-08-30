import supertest from 'supertest'
import fs from 'fs'
import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import app from '../index'
import {
  Attachment,
  Author,
  Grader,
  Program,
  ProgramManagement,
  StudyTrack,
  Supervision,
  Thesis,
  User,
} from '../db/models'
import { userFields } from './config'

const request = supertest.agent(app)

const userAttributesToFetch = userFields

describe('user router', () => {
  let user1
  let user2
  let user3

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
  })

  describe('GET /api/user/theses', () => {
    describe('when the user is not a teacher', () => {
      it('should return 403', async () => {
        const response = await request.get('/api/user/theses')
        expect(response.status).toEqual(403)
      })
    })

    describe('when there are no theses', () => {
      it('should return 200 and an empty array', async () => {
        const response = await request
          .get('/api/user/theses')
          .set({ uid: user1.id, hygroupcn: 'hy-employees' })
        expect(response.status).toEqual(200)
        expect(response.body).toEqual([])
      })
    })

    describe('when there are theses saved in the DB', () => {
      let thesis1
      let thesis2
      let thesis3

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
        thesis2 = await Thesis.create({
          programId: 'Testing program',
          studyTrackId: 'test-study-track-id',
          topic: 'test topic',
          status: 'PLANNING',
          startDate: '1970-01-01',
          targetDate: '2070-01-01',
        })
        thesis3 = await Thesis.create({
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
          percentage: 100,
          isPrimarySupervisor: true,
        })
        await Supervision.create({
          userId: user2.id,
          thesisId: thesis2.id,
          percentage: 100,
          isPrimarySupervisor: true,
        })
        await Supervision.create({
          userId: user3.id,
          thesisId: thesis3.id,
          percentage: 100,
          isPrimarySupervisor: true,
        })

        await ProgramManagement.create({
          programId: 'Testing program',
          userId: user2.id,
        })
      })

      describe('when the teacher user fetches own theses', () => {
        it('should return all theses supervised by the user', async () => {
          const response = await request
            .get('/api/user/theses')
            .set({ uid: user1.id, hygroupcn: 'hy-employees' })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: thesis1.id,
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user1,
                  percentage: 100,
                  isPrimarySupervisor: true,
                },
              ],
            },
          ])
        })
      })

      describe('when the program manager user fetches own theses', () => {
        it('should return all theses supervised by the user, but not the others in the managed program', async () => {
          const response = await request
            .get('/api/user/theses')
            .set({ uid: user2.id, hygroupcn: 'hy-employees' })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: thesis2.id,
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user2,
                  percentage: 100,
                  isPrimarySupervisor: true,
                },
              ],
            },
          ])
        })
      })

      describe('when an admin user fetches own theses', () => {
        it('should return all theses supervised by the user and only those', async () => {
          const response = await request
            .get('/api/user/theses')
            .set({ uid: user3.id, hygroupcn: 'hy-employees' })
          expect(response.status).toEqual(200)
          expect(response.body).toMatchObject([
            {
              id: thesis3.id,
              programId: 'Testing program',
              studyTrackId: 'test-study-track-id',
              topic: 'test topic',
              status: 'PLANNING',
              startDate: '1970-01-01T00:00:00.000Z',
              targetDate: '2070-01-01T00:00:00.000Z',
              supervisions: [
                {
                  user: user3,
                  percentage: 100,
                  isPrimarySupervisor: true,
                },
              ],
            },
          ])
        })
      })
    })
  })
})
