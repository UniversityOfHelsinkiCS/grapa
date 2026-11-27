import cron from 'node-cron'

import logger from './logger.ts'
import { run as runUpdater } from '../updater/index.ts'
import { sendScheduledEmails } from '../services/thesisNotificationService.ts'
import { inDevelopment } from '../../config.ts'
import { UPDATER_CRON_ENABLED } from './config.ts'
import { checkIdleTheses } from '../services/thesisService.ts'

const setupCron = async () => {
  logger.info('Starting cron jobs')

  if (inDevelopment) {
    await runUpdater()
    await checkIdleTheses()
  } else if (UPDATER_CRON_ENABLED) {
    cron.schedule('45 0,12 * * *', runUpdater) // Run updater every 12 hours
    cron.schedule('0 7 * * *', sendScheduledEmails) // Run email job every day at 07:00
    cron.schedule('0 2 * * *', checkIdleTheses) // Check for idle theses every day at 02:00
  }
}

export default setupCron
