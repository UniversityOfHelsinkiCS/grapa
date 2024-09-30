import { MutableRefObject } from 'react'
import { User } from '@backend/types'
import { GridRowSelectionModel } from '@mui/x-data-grid/models/gridRowSelectionModel'

export enum StatusLocale {
  PLANNING = 'thesisStages:planned',
  IN_PROGRESS = 'thesisStages:inProgress',
  COMPLETED = 'thesisStages:completed',
  CANCELLED = 'thesisStages:cancelled',
}

export interface SupervisorSelection {
  user: Partial<User> | null
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}

export interface ThesisFooterProps {
  footerRef: MutableRefObject<HTMLDivElement>
  rowSelectionModel: GridRowSelectionModel[]
  handleEditThesis: () => void
  handleDeleteThesis: () => void
}
