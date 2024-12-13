import { GridRowSelectionModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'

import { ThesisData } from '@backend/types'

import apiClient from '../util/apiClient'

interface UsePaginatedThesesParams {
  programId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  onlySupervised: boolean
  offset: number
  limit: number
}

export const usePaginatedTheses = (params: UsePaginatedThesesParams) => {
  const queryKey = [
    'theses',
    params.onlySupervised,
    params.offset,
    params.limit,
    params.programId,
    params.status,
    params.topicPartial,
    params.authorsPartial,
    params.programNamePartial,
  ]

  const queryFn = async (): Promise<{
    theses: ThesisData[]
    totalCount: number
  }> => {
    const { data } = await apiClient.get('/theses/paginate', { params })

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
