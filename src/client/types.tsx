import { User } from '@backend/types'

export interface SupervisorSelection {
  user: Partial<User> | null
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}
