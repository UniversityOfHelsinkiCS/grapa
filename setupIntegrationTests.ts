import supertest from 'supertest'
import { jest } from '@jest/globals'
import * as db from './src/server/db/connection'
import app from './src/server/index'
import {
  Attachment,
  Author,
  Program,
  Supervision,
  Thesis,
  User,
} from './src/server/db/models'

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

global.jest = jest

// eslint-disable-next-line import/no-mutable-exports
let request: any = null

global.beforeAll(async () => {
  // retry to connect to the DB in case the test runner starts before the DB is ready
  await db.connectToDatabase(3)
  request = supertest(app)

  let response: any = null
  let retryCount = 0
  while (retryCount < 3) {
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await request.get('/api/theses')
      expect(response.status).toEqual(200)
      break
    } catch (error) {
      retryCount += 1
      // eslint-disable-next-line no-await-in-loop
      await sleep(2000)
    }
  }
}, 20000)

global.afterEach(async () => {
  await Attachment.destroy({ where: {} })
  await Supervision.destroy({ where: {} })
  await Author.destroy({ where: {} })
  await Thesis.destroy({ where: {} })
  await User.destroy({ where: {} })
  await Program.destroy({ where: {} })
})

global.afterAll(async () => {
  await db.resetDatabase()
})

// eslint-disable-next-line import/prefer-default-export
export { request }
