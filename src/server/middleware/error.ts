import { Request, Response, NextFunction } from 'express'
import { ValidationError, UniqueConstraintError } from 'sequelize'

import Sentry from '@sentry/node'

import logger from '../util/logger'
import { inProduction } from '../../config'

import ZodValidationError from '../errors/ValidationError'

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${error.message} ${error.name} ${error.stack}`)

  if (inProduction) Sentry.captureException(error)

  if (error.name === 'ZodValidationError') {
    return res.status(400).send({
      error: error.message,
      data: (error as ZodValidationError).errors,
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
