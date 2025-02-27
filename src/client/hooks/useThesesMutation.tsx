import { useMutation } from '@tanstack/react-query'
import { ThesisData } from '@backend/types'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateThesisMutation = () => {
  const mutationFn = async (data: ThesisData) => {
    const formData = new FormData()

    // Check for the empty studyTrackId
    // If it's an empty string, set it to null
    if (data.studyTrackId === '') {
      data.studyTrackId = null
    }
    formData.append('json', JSON.stringify(data))

    if (data.researchPlan instanceof Blob) {
      formData.append('researchPlan', data.researchPlan)
    }
    if (data.waysOfWorking instanceof Blob) {
      formData.append('waysOfWorking', data.waysOfWorking)
    }

    await apiClient.post(`/theses`, formData)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['theses'],
      }),
  })

  return mutation
}

export const useEditThesisMutation = () => {
  const mutationFn = async ({
    thesisId,
    data,
  }: {
    thesisId: string
    data: ThesisData
  }) => {
    const formData = new FormData()

    // Check for the empty studyTrackId
    // If it's an empty string, set it to null
    if (data.studyTrackId === '') {
      data.studyTrackId = null
    }
    formData.append('json', JSON.stringify(data))

    if (data.researchPlan instanceof Blob) {
      formData.append('researchPlan', data.researchPlan)
    }
    if (data.waysOfWorking instanceof Blob) {
      formData.append('waysOfWorking', data.waysOfWorking)
    }

    await apiClient.put(`/theses/${thesisId}`, formData)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['theses'],
      })
      queryClient.invalidateQueries({
        queryKey: ['event-log', variables.thesisId],
      })
    },
  })

  return mutation
}

export const useDeleteThesisMutation = () => {
  const mutationFn = async (thesisId: string) => {
    await apiClient.delete(`/theses/${thesisId}`)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['theses'],
      }),
  })

  return mutation
}
