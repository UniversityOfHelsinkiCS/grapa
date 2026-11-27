import { z } from 'zod'
import type { NextFunction } from 'express'
import type { ServerPostRequest } from '../types.ts'
import CustomValidationError from '../errors/ValidationError.ts'

const DepartmentAdminSchema = z.object({
  departmentId: z.string().uuid(),
  userId: z.string().min(1),
})

export const validateDepartmentAdminData = (
  req: ServerPostRequest,
  _: Express.Response,
  next: NextFunction
) => {
  const departmentAdminData = req.body

  const parsedBody = DepartmentAdminSchema.safeParse(departmentAdminData)

  if (!parsedBody.success) {
    throw new CustomValidationError('Invalid department admin data', {
      errors: parsedBody.error,
    })
  }

  next()
}
