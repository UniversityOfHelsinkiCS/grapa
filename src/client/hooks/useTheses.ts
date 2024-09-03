import { GridRowSelectionModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'

import { ThesisData } from '@backend/types'

import apiClient from '../util/apiClient'

interface UseThesesOptions {
  onlySupervised: boolean
}
export const useTheses = ({ onlySupervised }: UseThesesOptions) => {
  const queryKey = ['theses', onlySupervised]

  const queryFn = async (): Promise<ThesisData[]> => {
    const { data } = await apiClient.get(
      `/theses${onlySupervised ? '?onlySupervised=true' : ''}`
    )

    return data
  }

  const { data: theses, ...rest } = useQuery({ queryKey, queryFn })

  return { theses, ...rest }
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
