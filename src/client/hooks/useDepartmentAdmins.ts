import { useQuery } from '@tanstack/react-query'
import { DepartmentAdminData, ThesisStatistics } from '@backend/types'
import apiClient from '../util/apiClient'

const useDepartmentAdmins = () => {
  const queryKey = ['department-admins']

  const queryFn = async (): Promise<DepartmentAdminData[]> => {
    const { data } = await apiClient.get(`/department-admins`)

    return data
  }

  const { data: departmentAdmins, ...rest } = useQuery({ queryKey, queryFn })

  return { departmentAdmins, ...rest }
}

export const useDepartmentStatistics = () => {
  const queryKey = ['department-admins', 'statistics']

  const queryFn = async (): Promise<ThesisStatistics[]> => {
    const { data } = await apiClient.get(`/department-admins/statistics`)

    return data
  }

  const { data: departmentStatistics, ...rest } = useQuery({
    queryKey,
    queryFn,
  })

  return { departmentStatistics, ...rest }
}

export default useDepartmentAdmins
