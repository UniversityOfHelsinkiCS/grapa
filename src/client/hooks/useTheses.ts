import { GridRowSelectionModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'

import { ThesisData } from '@backend/types'

import apiClient from '../util/apiClient'
import { useTranslation } from 'react-i18next'

interface UsePaginatedThesesParams {
  order: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  programId?: string
  departmentId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  onlySupervised: boolean
  offset: number
  limit: number
}

export const usePaginatedTheses = (params: UsePaginatedThesesParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n
  const queryKey = [
    'theses',
    params.onlySupervised,
    params.offset,
    params.limit,
    params.programId,
    params.departmentId,
    params.status,
    params.topicPartial,
    params.authorsPartial,
    params.programNamePartial,
    params.order.sortBy,
    params.order.sortOrder,
    language,
  ]

  const queryFn = async (): Promise<{
    theses: ThesisData[]
    totalCount: number
  }> => {
    const { data } = await apiClient.get('/theses/paginate', {
      params: {
        onlySupervised: params.onlySupervised,
        offset: params.offset,
        limit: params.limit,
        programId: params.programId,
        departmentId: params.departmentId,
        status: params.status,
        topicPartial: params.topicPartial,
        authorsPartial: params.authorsPartial,
        programNamePartial: params.programNamePartial,
        language,
        ...params.order,
      },
    })

    return data
  }

  const { data, ...rest } = useQuery({ queryKey, queryFn })

  return { theses: data?.theses, totalCount: data?.totalCount, ...rest }
}

export const useSingleThesis = (id: string | GridRowSelectionModel) => {
  const queryKey = ['theses', id]

  const queryFn = async (): Promise<ThesisData> => {
    const { data } = await apiClient.get(`/theses/${id}`)

    return data
  }

  const { data: thesis, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(id),
  })

  return { thesis, ...rest }
}
