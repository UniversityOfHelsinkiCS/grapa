import { NextFunction, Response } from 'express'
import { EthesisAdmin } from '../db/models'

const ethesisAdminHandler = async (
  req: any,
  _: Response,
  next: NextFunction
) => {
  const currentUser = req.user
  const ethesisAdmined = await EthesisAdmin.findAll({
    where: { userId: currentUser.id },
  })
  currentUser.ethesisAdmin = ethesisAdmined.length > 0 || currentUser.isAdmin

  return next()
}

export default ethesisAdminHandler
