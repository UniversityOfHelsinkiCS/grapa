import {
  createSortedRowModel,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  stockFeatures,
  tableFeatures,
} from '@tanstack/react-table'

export const prethesisTableFeatures = tableFeatures({
  ...stockFeatures,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
})

export type PrethesisTableFeatures = typeof prethesisTableFeatures
