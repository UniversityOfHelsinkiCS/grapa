import { useQuery } from '@tanstack/react-query'
import { ProgramManagementData } from '@backend/types'
import apiClient from '../util/apiClient'

const useProgramManagements = () => {
  const queryKey = ['program-managements']

  const queryFn = async (): Promise<ProgramManagementData[]> => {
    const { data } = await apiClient.get(`/program-managements`)

    return data
  }

  const { data: programManagements, ...rest } = useQuery({ queryKey, queryFn })

  return { programManagements, ...rest }
}

export default useProgramManagements
