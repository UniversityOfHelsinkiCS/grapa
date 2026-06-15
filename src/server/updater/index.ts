import * as Sentry from '@sentry/node'
import logger from '../util/logger'
import { fetchUsers } from './users'
import { clearOffsets } from './util'
import { fetchPrograms } from './programs'
import { fetchStudyTracks } from './studyTracks'
import { fetchThesesAttainments } from './attainments'

const runUpdater = async () => {
  await fetchPrograms()
  await fetchStudyTracks()
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
