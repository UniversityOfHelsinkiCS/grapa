import { useMutation } from '@tanstack/react-query'
import { ProgramManagementData } from '@backend/types'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateProgramManagementMutation = () => {
  const mutationFn = async (data: ProgramManagementData) => {
    await apiClient.post(`/program-managements`, data)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['program-managements'],
      }),
  })

  return mutation
}

export const useDeleteProgramManagementMutation = () => {
  const mutationFn = async (programManagementId: string) => {
    await apiClient.delete(`/program-managements/${programManagementId}`)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['program-managements'],
      }),
  })

  return mutation
}
