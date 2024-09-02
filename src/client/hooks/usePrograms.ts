import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProgramData } from '@backend/types'

import { getSortedByName } from '../components/ThesisPage/util'
import apiClient from '../util/apiClient'

interface UseProgramsParams {
  includeNotManaged?: boolean
}

const usePrograms = (params: UseProgramsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = ['programs', params?.includeNotManaged]

  const queryFn = async (): Promise<ProgramData[]> => {
    const { data } = await apiClient.get('/programs', { params })

    return data
  }

  const { data: programs, ...rest } = useQuery({ queryKey, queryFn })

  const sortedPrograms = getSortedByName(programs, language) as ProgramData[]

  return { programs: sortedPrograms, ...rest }
}

export default usePrograms
