import { NextFunction, Response } from 'express'

const ethesisUserHandler = async (
  req: any,
  _: Response,
  next: NextFunction
) => {
  const currentUser = req.user
  if (!currentUser) {
    throw new Error('Unauthorized')
  }
  return next()
}

export default ethesisUserHandler
