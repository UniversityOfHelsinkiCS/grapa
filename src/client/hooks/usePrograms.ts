import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ProgramData, TranslatedName } from '@backend/types'

import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

interface UseProgramsParams {
  includeNotManaged?: boolean
  includeDisabled?: boolean
  enabled?: boolean
  useStudentApi?: boolean
}

const usePrograms = (params: UseProgramsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = [
    'programs',
    params?.includeNotManaged,
    params?.includeDisabled,
    language,
  ]

  const apiPath = params.useStudentApi ? '/student/programs' : '/programs'

  const queryFn = async (): Promise<ProgramData[]> => {
    const { data } = await apiClient.get(apiPath, {
      params: { ...params, language },
    })

    return data
  }

  const { data: programs, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: params?.enabled ?? true,
  })

  return { programs, ...rest }
}

interface UpdateProgramParams {
  programId: string
  options: Record<string, unknown>
  name?: TranslatedName
  enabled?: boolean
}

export const useUpdateProgramMutation = () => {
  const mutationFn = async ({
    programId,
    options,
    name,
    enabled,
  }: UpdateProgramParams) => {
    await apiClient.put(`/programs/${programId}`, { options, name, enabled })
  }

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['programs'],
      })
    },
  })
}

export default usePrograms
