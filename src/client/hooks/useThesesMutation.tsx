import { useMutation } from '@tanstack/react-query'
import { ThesisData } from '@backend/types'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateThesisMutation = () => {
  const mutationFn = async (data: ThesisData) => {
    if (data.researchPlan) {
      const formData = new FormData()

      formData.append('json', JSON.stringify(data))
      formData.append('researchPlan', data.researchPlan)
      formData.append('waysOfWorking', data.waysOfWorking)

      await apiClient.post(`/theses`, formData)
      return
    }

    await apiClient.post(`/theses`, data)
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
    await apiClient.put(`/theses/${thesisId}`, data)
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
