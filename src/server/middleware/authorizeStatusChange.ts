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

  const thesis = await Thesis.findByPk(req.params.id)

  // if the thesis' status is already something else than PLANNING
  // allow anyone who can edit the thesis to update the status
  if (thesis && thesis.status !== 'PLANNING') {
    next()
    return
  }

  // but if current thesis' status is PLANNING
  // and the user is trying to update it
  // to something else than PLANNING,
  // then we need to check permissions i.e.
  // only allow it if the user is the program manager
  // or admin
  const programsManagedByUser = await ProgramManagement.findAll({
    attributes: ['programId'],
    where: { userId: actionUser.id },
  })
  const programIdsManagedByUser = programsManagedByUser.map(
    (program) => program.programId
  )

  if (!programIdsManagedByUser.includes(req.body.programId)) {
    // if the user is not admin, not program manager and the status is changed
    // or the thesis a new one throw an Authorization error
    if (!thesis || thesis.status !== req.body.status) {
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
