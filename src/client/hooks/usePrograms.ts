import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ProgramData } from '@backend/validators/programResponse'
import { TranslatedName } from '@backend/validators/departmentResponse'

import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'
import useLoggedInUser from './useLoggedInUser'

interface UseProgramsParams {
  includeNotManaged?: boolean
  includeDisabled?: boolean
  enabled?: boolean
  useStudentApi?: boolean
  includeManagedStudyTracks?: boolean
}

const usePrograms = (params: UseProgramsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n
  const { user } = useLoggedInUser()

  const queryKey = [
    'programs',
    params?.includeNotManaged,
    params?.includeDisabled,
    params?.includeManagedStudyTracks,
    language,
  ]

  const apiPath = params.useStudentApi ? '/student/programs' : '/programs'

  const queryFn = async (): Promise<ProgramData[]> => {
    const { data } = await apiClient.get(apiPath, {
      params: { ...params, language },
    })

    return data
  }

  const { data, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: params?.enabled ?? true,
  })

  const programs = useMemo(() => {
    if (!data) return undefined
    if (user?.isAdmin || params?.includeNotManaged) return data
    return data.filter((p) => p.isManaged)
  }, [data, params?.includeNotManaged, user?.isAdmin])

  const studyTracks = useMemo(() => {
    if (!data) return undefined
    const allTracks = data.flatMap((p) => p.studyTracks || [])
    if (user?.isAdmin || params?.includeNotManaged) return allTracks
    return allTracks.filter((st) => st.isManaged)
  }, [data, params?.includeNotManaged, user?.isAdmin])

  return { data, programs, studyTracks, ...rest }
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
