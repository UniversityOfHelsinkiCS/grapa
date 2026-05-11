import { useQuery } from '@tanstack/react-query'

import { User } from '@backend/types'

import apiClient from '../util/apiClient'

const useLoggedInUser = () => {
  const queryKey = ['user']

  const queryFn = async (): Promise<User> => {
    const { data } = await apiClient.get('/user/')

    return data
  }

  const { data: user, ...rest } = useQuery({ queryKey, queryFn })

  const hasStaffAccess = Boolean(
    user?.isAdmin ||
      user?.hasSeminarSupervisions ||
      user?.managedProgramIds?.length ||
      user?.managedDepartmentIds?.length ||
      user?.ethesisAdmin
  )

  return { user, hasStaffAccess, ...rest }
}

export default useLoggedInUser
