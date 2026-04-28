import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ProgramData } from '@backend/types'

import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

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

interface UpdateProgramOptionsParams {
  programId: string
  options: Record<string, unknown>
}

export const useUpdateProgramOptionsMutation = () => {
  const mutationFn = async ({
    programId,
    options,
  }: UpdateProgramOptionsParams) => {
    await apiClient.put(`/programs/${programId}`, { options })
  }

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['programs'],
      })
    },
  })
}

export default usePrograms
