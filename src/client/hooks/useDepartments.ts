import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import apiClient from '../util/apiClient'

import { DepartmentData as Department } from '../../server/types'

interface UseDepartmentsParams {
  includeNotManaged?: boolean
}

const useDepartments = (params: UseDepartmentsParams) => {
  const { i18n } = useTranslation()
  const { language } = i18n

  const queryKey = ['departments', params?.includeNotManaged, language]

  const queryFn = async (): Promise<Department[]> => {
    const { data } = await apiClient.get(`/departments`, {
      params: { ...params, language },
    })

    return data
  }

  const { data: departments, ...rest } = useQuery({ queryKey, queryFn })

  return { departments, ...rest }
}

export default useDepartments
