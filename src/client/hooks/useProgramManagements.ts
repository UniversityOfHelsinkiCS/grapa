import { useQuery } from '@tanstack/react-query'
import { ProgramManagementData } from '@backend/types'
import apiClient from '../util/apiClient'

type UseProgramManagementsOptions =
  | {
      onlyThesisApprovers: boolean
      programId: string
      limitToEditorsPrograms: boolean
    }
  | undefined
const useProgramManagements = (
  {
    onlyThesisApprovers,
    programId,
    limitToEditorsPrograms,
  }: UseProgramManagementsOptions = {
    onlyThesisApprovers: undefined,
    limitToEditorsPrograms: undefined,
    programId: undefined,
  }
) => {
  const queryKey = [
    'program-managements',
    programId,
    onlyThesisApprovers,
    limitToEditorsPrograms,
  ]

  const queryFn = async (): Promise<ProgramManagementData[]> => {
    const { data } = await apiClient.get(`/program-managements`, {
      params: {
        programId,
        onlyThesisApprovers,
        limitToEditorsPrograms,
      },
    })

    return data
  }

  const { data: programManagements, ...rest } = useQuery({ queryKey, queryFn })

  return { programManagements, ...rest }
}

export default useProgramManagements
