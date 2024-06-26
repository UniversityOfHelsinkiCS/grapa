import { Request, Response, NextFunction } from 'express'
import { ValidationError, UniqueConstraintError } from 'sequelize'

import * as Sentry from '@sentry/node'

import logger from '../util/logger'
import { inProduction } from '../../config'

import CustomValidationError from '../errors/ValidationError'
import CustomAuthorizationError from '../errors/AuthorizationError'

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${error.message} ${error.name} ${error.stack}`)

  if (inProduction) Sentry.captureException(error)

  if (error.name === 'CustomValidationError') {
    return res.status(400).send({
      error: error.message,
      data: (error as CustomValidationError).errors,
    })
  }

  if (error.name === 'CustomAuthorizationError') {
    return res.status(403).send({
      error: error.message,
      data: (error as CustomAuthorizationError).errors,
    })
  }

  if (error.name === 'SequelizeValidationError') {
    return res
      .status(400)
      .send({ error: error.message, data: (error as ValidationError).errors })
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).send({
      error: error.message,
      data: (error as UniqueConstraintError).errors,
    })
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).send({
      error: error.message,
      data: null,
    })
  }

  if (error.name === 'NotFoundError') {
    return res.status(404).send({
      error: error.message,
      data: null,
    })
  }

  return next(error)
}

export default errorHandler
