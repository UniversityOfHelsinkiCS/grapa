import { useQuery } from '@tanstack/react-query'
import { EventLogEntry } from '@backend/types'

import apiClient from '../util/apiClient'

interface UseEventsParams {
  thesisId: string
}

const useEvents = (params: UseEventsParams) => {
  const queryKey = ['event-log', params.thesisId]

  const queryFn = async (): Promise<EventLogEntry[]> => {
    const { data } = await apiClient.get(`/event-log/${params.thesisId}`)

    return data
  }

  const { data: events, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(params.thesisId),
  })

  return { events, ...rest }
}

export default useEvents
