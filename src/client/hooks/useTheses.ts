import { GridRowSelectionModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'

import { ThesisData } from '@backend/types'

import apiClient from '../util/apiClient'
import { useTranslation } from 'react-i18next'

interface UsePaginatedThesesParams {
  order: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  programId?: string
  studyTrackId?: string
  departmentId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string | string[]
  onlyAuthored?: boolean
  onlySupervised: boolean
  onlySeminarSupervised?: boolean
  offset: number
  limit: number
  useStudentApi?: boolean
  search?: string
  milestone?: string | number
}

export const usePaginatedTheses = (params: UsePaginatedThesesParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = [
    'theses',
    params.onlyAuthored,
    params.onlySupervised,
    params.onlySeminarSupervised,
    params.offset,
    params.limit,
    params.programId,
    params.studyTrackId,
    params.departmentId,
    params.status,
    params.topicPartial,
    params.authorsPartial,
    params.programNamePartial,
    params.order.sortBy,
    params.order.sortOrder,
    params.search,
    params.milestone,
    language,
    params.useStudentApi,
  ]

  const queryFn = async (): Promise<{
    theses: ThesisData[]
    totalCount: number
    availableMilestones?: number[]
  }> => {
    const endpoint = params.useStudentApi
      ? '/student/theses'
      : '/theses/paginate'
    const { data } = await apiClient.get(endpoint, {
      params: {
        onlyAuthored: params.onlyAuthored,
        onlySupervised: params.onlySupervised,
        onlySeminarSupervised: params.onlySeminarSupervised,
        offset: params.offset,
        limit: params.limit,
        programId: params.programId,
        studyTrackId: params.studyTrackId,
        departmentId: params.departmentId,
        status: params.status,
        topicPartial: params.topicPartial,
        authorsPartial: params.authorsPartial,
        programNamePartial: params.programNamePartial,
        search: params.search,
        milestone: params.milestone,
        language,
        ...params.order,
      },
    })

    return data
  }

  const { data, ...rest } = useQuery({ queryKey, queryFn })

  return {
    theses: data?.theses,
    totalCount: data?.totalCount ?? 0,
    availableMilestones: data?.availableMilestones ?? [],
    ...rest,
  }
}

export const useSingleThesis = (
  id: string | GridRowSelectionModel,
  useStudentApi?: boolean
) => {
  const queryKey = ['theses', id]

  const queryFn = async (): Promise<ThesisData> => {
    const endpoint = useStudentApi ? `/student/theses/${id}` : `/theses/${id}`
    const { data } = await apiClient.get(endpoint)

    return data
  }

  const { data: thesis, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(id),
  })

  return { thesis, ...rest }
}
