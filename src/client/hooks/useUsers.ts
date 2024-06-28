import { useQuery } from '@tanstack/react-query'
import { User } from '@backend/types'
import apiClient from '../util/apiClient'

interface UseUsersOptions {
  search?: string
  onlyEmployees?: boolean
  onlyWithStudyRight?: boolean
}
const useUsers = ({
  search,
  onlyEmployees,
  onlyWithStudyRight,
}: UseUsersOptions) => {
  const queryKey = ['users', search, onlyEmployees, onlyWithStudyRight]

  const queryFn = async (): Promise<User[]> => {
    const trimmedSearch = search.trim()
    if (!trimmedSearch || trimmedSearch.length < 5) {
      return []
    }

    const { data } = await apiClient.get(
      `/users?search=${trimmedSearch}${onlyEmployees ? '&onlyEmployees=true' : ''}${onlyWithStudyRight ? '&onlyWithStudyRight=true' : ''}`
    )

    return data
  }

  const { data: users, ...rest } = useQuery({
    queryKey,
    queryFn,
  })

  return { users, ...rest }
}

export default useUsers
