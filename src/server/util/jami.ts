import axios from 'axios'

import { JAMI_URL, API_TOKEN } from './config'
import { inProduction } from '../../config'
import { TranslatedName } from '../types'

const jamiClient = axios.create({
  baseURL: JAMI_URL,
  params: {
    token: API_TOKEN,
    noLogging: !inProduction,
  },
})

export type ProgrammeLevel = 'bachelor' | 'master' | 'doctoral'

export type Programme = {
  readonly key: string
  readonly name: TranslatedName
  readonly level: ProgrammeLevel
  readonly companionFaculties: Readonly<string[]>
  readonly international: boolean
}

interface Faculty {
  readonly code: string
  readonly name: TranslatedName
  readonly programmes: Readonly<Programme[]>
}

type OrganisationData = Faculty[]

export const getOrganisationData = async (): Promise<OrganisationData> => {
  const { data } = await jamiClient.get('/organisation-data')

  return data
}
