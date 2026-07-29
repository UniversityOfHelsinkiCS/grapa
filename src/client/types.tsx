import { MutableRefObject } from 'react'
import { ThesisData as Thesis } from '@backend/validators/thesisResponse'
export type GridRowId = string | number
export type GridRowSelectionModel = {
  type?: 'include' | 'exclude'
  ids: Set<GridRowId>
}
export type GridFilterModel = { items: any[] }
export type GridPaginationModel = { page: number; pageSize: number }
export type GridSortModel = { field: string; sort: 'asc' | 'desc' }[]

export enum StatusLocale {
  DRAFT = 'thesisStages:draft',
  SUGGESTED = 'thesisStages:suggested',
  PLANNING = 'thesisStages:planned',
  IN_PROGRESS = 'thesisStages:inProgress',
  COMPLETED = 'thesisStages:completed',
  CANCELLED = 'thesisStages:cancelled',
  ETHESIS = 'thesisStages:ethesis',
  ETHESIS_SENT = 'thesisStages:ethesisSent',
}

export interface ThesisFooterProps {
  footerRef: MutableRefObject<HTMLDivElement>
  rowSelectionModel: GridRowSelectionModel
  handleEditThesis: (thesis: Thesis) => void
  handleDeleteThesis: (thesis: Thesis) => void
  isStudentView?: boolean
  onlySeminarSupervised?: boolean
  hideEdit?: boolean
  hideDelete?: boolean
}
