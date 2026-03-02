import CustomUnauthorizedError from '../errors/UnauthorizedError'
import { NextFunction, Response } from 'express'

const ethesisUserHandler = async (
  req: any,
  _: Response,
  next: NextFunction
) => {
  const currentUser = req.user
  if (!currentUser || !currentUser.id) {
    throw new CustomUnauthorizedError('Unauthorized')
  }
  return next()
}

export default ethesisUserHandler
