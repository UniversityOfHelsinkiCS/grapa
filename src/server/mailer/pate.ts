import axios from 'axios'

import logger from '../util/logger'

import { PATE_URL } from '../util/config'
import { inProduction, inStaging } from '../../config'

const settings = {
  hideToska: false,
  disableToska: true,
  color: '#107eab',
  header: 'Curre',
  headerFontColor: 'white',
  dryrun: !inProduction || inStaging,
}

const pateClient = axios.create({
  baseURL: PATE_URL,
  params: {
    token: process.env.API_TOKEN,
  },
})

const sendEmail = async (
  targets: string[],
  text: string,
  subject: string,
  replyTo: string
) => {
  const emails = targets.map((to) => ({ to, subject }))

  const mail = {
    template: {
      from: 'Prethesis',
      replyTo,
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

  await pateClient.post('/', mail)
}

export default sendEmail
