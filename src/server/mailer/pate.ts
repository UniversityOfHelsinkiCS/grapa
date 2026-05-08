import axios from 'axios'

import logger from '../util/logger'

import { PATE_URL } from '../util/config'
import { inProduction, inStaging } from '../../config'
import * as Sentry from '@sentry/node'

const settings = {
  hideToska: false,
  disableToska: true,
  color: '#107eab',
  header: 'Prethesis',
  headerFontColor: 'white',
  dryrun: !inProduction || inStaging,
}

const pateClient = axios.create({
  baseURL: PATE_URL,
  params: {
    token: process.env.API_TOKEN,
  },
})

const sendEmail = async (targets: string[], text: string, subject: string) => {
  try {
    const emails = targets.map((to) => ({ to, subject }))

    const mail = {
      template: {
        from: 'Prethesis',
        text,
      },
      emails,
      settings,
    }

    if (targets.length === 0) {
      throw new Error('No targets provided')
    }

    logger.info(`Sending emails to ${targets.length} recipients`, {
      recipients: targets,
      subject,
      text,
    })

    // should mock pate in dev
    if (process.env.NODE_ENV === 'production') {
      await pateClient.post('/', mail)
    }
  } catch (error) {
    logger.error('Failed to send email', error)
    Sentry.captureException(error)
    Sentry.captureMessage('Failed to send email')
  }
}

export default sendEmail
