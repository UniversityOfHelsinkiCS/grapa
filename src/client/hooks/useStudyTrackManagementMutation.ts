import { useMutation } from '@tanstack/react-query'
import { StudyTrackManagementData } from '@backend/validators/managementResponse'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateStudyTrackManagementMutation = () => {
  const mutationFn = async (data: Partial<StudyTrackManagementData>) => {
    await apiClient.post(`/study-track-managements`, data)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['study-track-managements'],
      }),
  })

  return mutation
}

export const useDeleteStudyTrackManagementMutation = () => {
  const mutationFn = async (studyTrackManagementId: string) => {
    await apiClient.delete(`/study-track-managements/${studyTrackManagementId}`)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['study-track-managements'],
      }),
  })

  return mutation
}
