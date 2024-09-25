import { z } from 'zod'
import { NextFunction } from 'express'
import { ServerThesesFiltersPutRequest } from '@backend/types'
import CustomValidationError from '../errors/ValidationError'

// Filter schema based on the MUI docs: https://mui.com/x/react-data-grid/filtering/#structure-of-the-model
const MUIfilterSchema = z.object({
  id: z.number(), // Unique ID for the filter
  field: z.string().min(1, 'Filter column name must be non-empty'), // Column name (e.g., 'name', 'age')
  operator: z.string().min(1, 'Filter operator value must be non-empty'), // Operator (e.g., 'contains', 'equals')
  value: z.union([
    // Value can be of different types (string, number, etc.)
    z.string(), // For text columns
    z.number(), // For numeric columns
    z.date(), // For date columns
    z.array(z.string()), // For multi-select columns
    z.undefined(), // For columns with no value (e.g., boolean columns)
  ]),
})

const ThesesTableFiltersSchema = z.array(MUIfilterSchema)

export const validateUserThesesTableFiltersData = (
  req: ServerThesesFiltersPutRequest,
  _: Express.Response,
  next: NextFunction
) => {
  const thesesTableFilters = req.body?.thesesTableFilters

  if (!thesesTableFilters) {
    throw new CustomValidationError('Theses table filters are missing', {
      errors: {
        thesesTableFilters:
          'Request payload must contain thesesTableFilters field',
      },
    })
  }

  const parsedBody = ThesesTableFiltersSchema.safeParse(thesesTableFilters)

  if (!parsedBody.success) {
    throw new CustomValidationError('Invalid theses table filters', {
      errors: parsedBody.error,
    })
  }

  next()
}
