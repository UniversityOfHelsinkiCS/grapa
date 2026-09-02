import { useQuery } from '@tanstack/react-query'

import { LoggedInUser as User } from '@backend/validators/userResponse'

import apiClient from '../util/apiClient'

const useLoggedInUser = () => {
  const queryKey = ['user']

  const queryFn = async (): Promise<User> => {
    const { data } = await apiClient.get('/user/')

    return data
  }

  const { data: user, ...rest } = useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false
      return failureCount < 3
    },
  })

  const hasStaffAccess = Boolean(
    user?.isAdmin ||
    user?.hasSeminarSupervisions ||
    user?.managedProgramIds?.length ||
    user?.managedStudyTrackIds?.length ||
    user?.managedDepartmentIds?.length ||
    user?.ethesisAdmin ||
    (user?.iamGroups ? user?.iamGroups.includes('hy-employees') : false)
  )

  return { user, hasStaffAccess, ...rest }
}

export default useLoggedInUser
