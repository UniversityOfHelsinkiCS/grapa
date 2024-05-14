import { Sequelize } from 'sequelize'
import { Umzug, SequelizeStorage } from 'umzug'
import Module from 'node:module'

import logger from '../util/logger'
import { DATABASE_URL } from '../util/config'

const DB_CONNECTION_RETRY_LIMIT = 10

const require = Module.createRequire(import.meta.url)

export const sequelize = new Sequelize(DATABASE_URL, { logging: false })
console.log(DATABASE_URL)

const umzug = new Umzug({
  migrations: {
    glob: 'src/server/db/migrations/*.cjs',
    resolve: ({ name, path, context }) => {
      // Adjust the migration from the new signature to the v2 signature, making easier to upgrade to v3
      // eslint-disable-next-line
      const migration = require(path)
      return {
        name,
        up: async () => migration.up(context),
        down: async () => migration.down(context),
      }
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
})

export type Migration = typeof umzug._types.migration

export const runMigrations = async () => {
  const migrations = await umzug.up()

  logger.info('Migrations up to date', {
    migrations,
  })
}

export const resetDatabase = async () => {
  await sequelize.drop({})
}

const testConnection = async () => {
  await sequelize.authenticate()
  await runMigrations()
}

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const connectToDatabase = async (attempt = 0): Promise<void | null> => {
  try {
    await testConnection()
  } catch (err: any) {
    if (attempt === DB_CONNECTION_RETRY_LIMIT) {
      logger.error(`Connection to database failed after ${attempt} attempts`, {
        error: err.stack,
      })

      return process.exit(1)
    }
    logger.info(
      `Connection to database failed! Attempt ${attempt} of ${DB_CONNECTION_RETRY_LIMIT}`
    )
    logger.error('Database error: ', err)
    await sleep(5000)

    return connectToDatabase(attempt + 1)
  }

  return null
}
