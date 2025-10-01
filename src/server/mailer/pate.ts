import axios from 'axios'

import logger from '../util/logger'

import { PATE_URL } from '../util/config'
import { inProduction, inStaging } from '../../config'

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
  const emails = targets.map((to) => ({ to, subject }))

  const mail = {
    template: {
      from: 'Prethesis',
      text,
    },
    emails,
    settings,
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
}

export default sendEmail
