import * as Sentry from '@sentry/node'
import logger from '../util/logger.ts'
import { fetchUsers } from './users.ts'
import { clearOffsets } from './util.ts'
import { fetchPrograms } from './programs.ts'
import { fetchThesesAttainments } from './attainments.ts'

const runUpdater = async () => {
  await fetchPrograms()
  await fetchUsers()
  await fetchThesesAttainments()
}

export const run = async () => {
  logger.info('[UPDATER] Running updater')

  try {
    await clearOffsets()
    await runUpdater()
    logger.info('[UPDATER] Finished updating')
    return { success: true }
  } catch (error) {
    Sentry.captureException(error)
    Sentry.captureMessage('Updater run failed!')
    logger.error('[UPDATER] finished with error', error)
    return { success: false, error }
  }
}
