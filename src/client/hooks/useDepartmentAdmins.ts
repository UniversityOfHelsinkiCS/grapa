import { useQuery } from '@tanstack/react-query'
import { DepartmentAdminData } from '@backend/validators/managementResponse'
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

export default useDepartmentAdmins
