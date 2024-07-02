import cron from 'node-cron'

import logger from './logger'
import { run as runUpdater } from '../updater'
import { UPDATER_CRON_ENABLED, inDevelopment } from '../../config'

const setupCron = async () => {
  logger.info('Starting cron jobs')

  if (inDevelopment) {
    await runUpdater()
  } else if (UPDATER_CRON_ENABLED) {
    cron.schedule('45 0,12 * * *', runUpdater) // Run updater every 12 hours
  }
}

export default setupCron
