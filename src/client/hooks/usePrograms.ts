import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ProgramData } from '@backend/types'

import { getSortedPrograms } from '../components/ThesisPage/util'
import apiClient from '../util/apiClient'

interface UseProgramsOptions {
  includeNotManaged?: boolean
}

const usePrograms = ({ includeNotManaged }: UseProgramsOptions) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = ['programs', includeNotManaged]

  const queryFn = async (): Promise<ProgramData[]> => {
    const { data } = await apiClient.get(
      `/programs${includeNotManaged ? '?includeNotManaged=true' : ''}`
    )

    return data
  }

  const { data: programs, ...rest } = useQuery({ queryKey, queryFn })

  return { programs: getSortedPrograms(programs, language), ...rest }
}

export default usePrograms
