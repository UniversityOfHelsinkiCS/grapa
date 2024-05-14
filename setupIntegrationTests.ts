import { jest } from '@jest/globals'
import * as db from './src/server/db/connection'

global.jest = jest

global.beforeEach(async () => {
  // retry to connect to the DB in case the test runner starts before the DB is ready
  await db.connectToDatabase(3)
}, 20000)

global.afterEach(async () => {
  await db.resetDatabase()
})
