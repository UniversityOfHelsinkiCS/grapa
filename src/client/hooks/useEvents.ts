import { useQuery } from '@tanstack/react-query'
import { EventLogEntry } from '@backend/types'

import apiClient from '../util/apiClient'

interface UseEventsParams {
  thesisId: string
  enabled?: boolean
}

const useEvents = ({ thesisId, enabled = true }: UseEventsParams) => {
  const queryKey = ['event-log', thesisId]

  const queryFn = async (): Promise<EventLogEntry[]> => {
    const { data } = await apiClient.get(`/theses/${thesisId}/event-log`)

    return data
  }

  const { data: events, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: enabled && Boolean(thesisId),
  })

  return { events, ...rest }
}

interface UseProgramEventsParams {
  programId: string | undefined
  enabled: boolean
  showNonAdminOnly: boolean
  limit?: number
  offset?: number
  search?: string
}
export const useProgramEvents = ({
  programId,
  enabled,
  showNonAdminOnly,
  limit,
  offset,
  search,
}: UseProgramEventsParams) => {
  const queryKey = [
    'program-event-log',
    programId,
    showNonAdminOnly,
    limit,
    offset,
    search,
  ]

  const queryFn = async (): Promise<{
    events: EventLogEntry[]
    totalCount: number
  }> => {
    const { data } = await apiClient.get(`/programs/${programId}/event-log`, {
      params: { nonAdminOnly: showNonAdminOnly, limit, offset, search },
    })

    return data
  }

  const { data: events, ...rest } = useQuery({
    staleTime: 1000 * 60,
    queryKey,
    queryFn,
    enabled: Boolean(enabled && programId),
  })

  return {
    events: events?.events,
    totalCount: events?.totalCount ?? 0,
    ...rest,
  }
}

export default useEvents
