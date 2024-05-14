import * as db from './src/server/db/connection'

global.beforeEach(async () => {
  await db.runMigrations()
})

global.afterEach(async () => {
  await db.resetDatabase()
})
