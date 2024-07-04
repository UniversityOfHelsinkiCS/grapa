import { NextFunction } from 'express'
import { ServerPostRequest, ServerPutRequest } from '../types'
import { ProgramManagement, Thesis } from '../db/models'
import CustomAuthorizationError from '../errors/AuthorizationError'

export const authorizeStatusChange = async (
  req: ServerPostRequest | ServerPutRequest,
  _: Express.Response,
  next: NextFunction
) => {
  const actionUser = req.user

  // admins are allowed to do anything
  if (actionUser.isAdmin) {
    next()
    return
  }

  // Allow having/changing status to PLANNING
  // to anyone.
  // But only users with elevated permissions
  // can change the status to anything else.
  if (req.body.status === 'PLANNING') {
    next()
    return
  }

  const programsManagedByUser = await ProgramManagement.findAll({
    attributes: ['programId'],
    where: { userId: actionUser.id },
  })
  const programIdsManagedByUser = programsManagedByUser.map(
    (program) => program.programId
  )

  if (!programIdsManagedByUser.includes(req.body.programId)) {
    const thesis = await Thesis.findByPk(req.params.id)

    // if the user is not admin, not program manager and the status is changed
    // throw an Authorization error
    if (thesis.status !== req.body.status) {
      throw new CustomAuthorizationError(
        'User is not authorized to change the status of the thesis',
        {
          programId: [
            'User is not authorized to change the status of the thesis',
          ],
        }
      )
    }
  }

  next()
}
