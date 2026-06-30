import cron from 'node-cron'

import logger from './logger'
import { run as runUpdater } from '../updater'
import { sendScheduledEmails } from '../services/thesisNotificationService'
import { UPDATER_CRON_ENABLED, inDevelopment } from '../../config'
import { checkIdleTheses } from '../services/thesisService'

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
