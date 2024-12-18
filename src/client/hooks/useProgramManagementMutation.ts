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
        queryKey: ['program-managements', undefined, undefined],
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
        queryKey: ['program-managements', undefined, undefined],
      }),
  })

  return mutation
}

interface UpdateProgramManagementData {
  programManagementId: string
  isThesisApprover: boolean
}
export const useUpdateProgramManagementMutation = () => {
  const mutationFn = async ({
    programManagementId,
    isThesisApprover,
  }: UpdateProgramManagementData) => {
    await apiClient.put(`/program-managements/${programManagementId}`, {
      isThesisApprover,
    })
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: (_, { programManagementId, isThesisApprover }) => {
      queryClient.setQueryData(
        ['program-managements', undefined, undefined, undefined],
        (oldData: ProgramManagementData[]) =>
          oldData.map((programManagement) =>
            programManagement.id === programManagementId
              ? {
                  ...programManagement,
                  isThesisApprover,
                }
              : programManagement
          )
      )
      queryClient.invalidateQueries({
        queryKey: ['program-managements', undefined, undefined, undefined],
      })
    },
  })

  return mutation
}
