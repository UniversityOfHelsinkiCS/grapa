import axios from 'axios'

import { JAMI_URL, API_TOKEN } from './config'
import { inProduction } from '../../config'

const jamiClient = axios.create({
  baseURL: JAMI_URL,
  params: {
    token: API_TOKEN,
    noLogging: !inProduction,
  },
})

export const getOrganisationData = async () => {
  const { data } = await jamiClient.get('/organisation-data')

  return data
}
