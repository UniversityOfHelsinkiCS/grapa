import { useQuery } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import { ProgramData as Program } from '../../server/types'

interface UseProgramsOptions {
  includeNotManaged?: boolean
}
const usePrograms = ({ includeNotManaged }: UseProgramsOptions) => {
  const queryKey = ['programs', includeNotManaged]

  const queryFn = async (): Promise<Program[]> => {
    const { data } = await apiClient.get(
      `/programs${includeNotManaged ? '?includeNotManaged=true' : ''}`
    )

    return data
  }

  const { data: programs, ...rest } = useQuery({ queryKey, queryFn })

  return { programs, ...rest }
}

export default usePrograms
