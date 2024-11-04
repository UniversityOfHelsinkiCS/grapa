import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProgramData } from '@backend/types'

import apiClient from '../util/apiClient'

interface UseProgramsParams {
  includeNotManaged?: boolean
}

const usePrograms = (params: UseProgramsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = ['programs', params?.includeNotManaged, language]

  const queryFn = async (): Promise<ProgramData[]> => {
    const { data } = await apiClient.get('/programs', {
      params: { ...params, language },
    })

    return data
  }

  const { data: programs, ...rest } = useQuery({ queryKey, queryFn })

  return { programs, ...rest }
}

export default usePrograms
