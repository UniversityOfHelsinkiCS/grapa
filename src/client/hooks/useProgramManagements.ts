import { useQuery } from '@tanstack/react-query'
import { ProgramManagementData } from '@backend/types'
import apiClient from '../util/apiClient'

type UseProgramManagementsOptions =
  | {
      onlyThesisApprovers: boolean
      programId: string
    }
  | undefined
const useProgramManagements = (
  { onlyThesisApprovers, programId }: UseProgramManagementsOptions = {
    onlyThesisApprovers: undefined,
    programId: undefined,
  }
) => {
  const queryKey = ['program-managements', programId, onlyThesisApprovers]

  const queryFn = async (): Promise<ProgramManagementData[]> => {
    const { data } = await apiClient.get(`/program-managements`, {
      params: {
        programId,
        onlyThesisApprovers,
      },
    })

    return data
  }

  const { data: programManagements, ...rest } = useQuery({ queryKey, queryFn })

  return { programManagements, ...rest }
}

export default useProgramManagements
