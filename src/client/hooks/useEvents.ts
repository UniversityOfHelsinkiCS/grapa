import { useQuery } from '@tanstack/react-query'
import { EventLogEntry } from '@backend/types'

import apiClient from '../util/apiClient'

interface UseEventsParams {
  thesisId: string
}

const useEvents = ({ thesisId }: UseEventsParams) => {
  const queryKey = ['event-log', thesisId]

  const queryFn = async (): Promise<EventLogEntry[]> => {
    const { data } = await apiClient.get(`/theses/${thesisId}/event-log`)

    return data
  }

  const { data: events, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: Boolean(thesisId),
  })

  return { events, ...rest }
}

export default useEvents
