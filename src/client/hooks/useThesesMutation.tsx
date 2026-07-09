import { useMutation } from '@tanstack/react-query'
import { ThesisData } from '@backend/types'
import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

export const useCreateThesisMutation = (isStudentView?: boolean) => {
  const mutationFn = async (data: ThesisData) => {
    const formData = new FormData()

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

    const apiPath = isStudentView ? '/student/theses' : '/theses'

    await apiClient.post(apiPath, formData)
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

export const useEditThesisMutation = (isStudentView?: boolean) => {
  const mutationFn = async ({
    thesisId,
    data,
  }: {
    thesisId: string
    data: ThesisData
  }) => {
    const formData = new FormData()

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

    const apiPath = isStudentView ? '/student/theses/' : '/theses/'
    await apiClient.put(apiPath + `${thesisId}`, formData)
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['theses'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['event-log', variables.thesisId],
      })
    },
  })

  return mutation
}

export const useChangeThesisStatusMutation = (isStudentView?: boolean) => {
  const mutationFn = async ({
    theses,
    status,
  }: {
    theses: ThesisData[]
    status: ThesisData['status']
  }) => {
    await Promise.all(
      theses.map(async (thesis) => {
        const formData = new FormData()

        if (thesis.studyTrackId === '') {
          thesis.studyTrackId = null
        }

        const updatedThesis = { ...thesis, status }
        formData.append('json', JSON.stringify(updatedThesis))

        const apiPath = isStudentView ? '/student/theses/' : '/theses/'
        await apiClient.put(apiPath + `${thesis.id}`, formData)
      })
    )
  }

  const mutation = useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['theses'],
      })
      variables.theses.forEach((thesis) => {
        void queryClient.invalidateQueries({
          queryKey: ['event-log', thesis.id],
        })
      })
    },
  })

  return mutation
}

export const useDeleteThesisMutation = (isStudentView?: boolean) => {
  const mutationFn = async (thesisId: string) => {
    await apiClient.delete(
      isStudentView ? `/student/theses/${thesisId}` : `/theses/${thesisId}`
    )
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
