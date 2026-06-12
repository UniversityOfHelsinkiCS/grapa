import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import apiClient from '../util/apiClient'
import queryClient from '../util/queryClient'

import {
  DepartmentData as Department,
  TranslatedName,
} from '../../server/types'

interface UseDepartmentsParams {
  includeNotManaged?: boolean
  includeDisabled?: boolean
  enabled?: boolean
}

const useDepartments = (params: UseDepartmentsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = [
    'departments',
    params?.includeNotManaged,
    params?.includeDisabled,
    language,
  ]

  const queryFn = async (): Promise<Department[]> => {
    const { data } = await apiClient.get(`/departments`, {
      params: { ...params, language },
    })

    return data
  }

  const { data: departments, ...rest } = useQuery({
    queryKey,
    queryFn,
    enabled: params?.enabled ?? true,
  })

  return { departments, ...rest }
}

export default useDepartments

interface UpdateDepartmentParams {
  departmentId: string
  name: TranslatedName
  enabled?: boolean
}

export const useUpdateDepartmentMutation = () => {
  const mutationFn = async ({
    departmentId,
    name,
    enabled,
  }: UpdateDepartmentParams) => {
    await apiClient.put(`/departments/${departmentId}`, { name, enabled })
  }

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departments'],
      })
    },
  })
}

interface CreateDepartmentParams {
  name: TranslatedName
  enabled?: boolean
}

export const useCreateDepartmentMutation = () => {
  const mutationFn = async (params: CreateDepartmentParams) => {
    await apiClient.post(`/departments`, params)
  }

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['departments'],
      })
    },
  })
}
