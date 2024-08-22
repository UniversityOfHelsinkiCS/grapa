import { User } from '@backend/types'
import { GridRowSelectionModel } from '@mui/x-data-grid/models/gridRowSelectionModel'

export interface SupervisorSelection {
  user: Partial<User> | null
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}

export interface ThesisFooterProps {
  rowSelectionModel: GridRowSelectionModel[]
  handleEditThesis: () => void
  handleDeleteThesis: () => void
}
