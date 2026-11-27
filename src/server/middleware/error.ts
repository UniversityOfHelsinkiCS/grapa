import type { Request, Response, NextFunction } from 'express'
import type { ValidationError, UniqueConstraintError } from 'sequelize'
import { MulterError } from 'multer'

import * as Sentry from '@sentry/node'

import logger from '../util/logger.ts'
import { inProduction } from '../../config.ts'

import type CustomValidationError from '../errors/ValidationError.ts'
import type CustomAuthorizationError from '../errors/AuthorizationError.ts'

const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${error.message} ${error.name} ${error.stack}`)

  if (error instanceof MulterError) {
    res
      .status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .send({ error: error.message, data: null })
    return
  }

  if (inProduction) Sentry.captureException(error)

  if (error.name === 'CustomValidationError') {
    res.status(400).send({
      error: error.message,
      data: (error as CustomValidationError).errors,
    })
    return
  }

  if (error.name === 'CustomAuthorizationError') {
    res.status(403).send({
      error: error.message,
      data: (error as CustomAuthorizationError).errors,
    })
    return
  }

  if (error.name === 'SequelizeValidationError') {
    res
      .status(400)
      .send({ error: error.message, data: (error as ValidationError).errors })
    return
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(400).send({
      error: error.message,
      data: (error as UniqueConstraintError).errors,
    })
    return
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).send({
      error: error.message,
      data: null,
    })
    return
  }
  if (error.name === 'CustomUnauthorizedError') {
    res.status(401).send(error.message)
    return
  }

  if (error.name === 'NotFoundError') {
    res.status(404).send({
      error: error.message,
      data: null,
    })
    return
  }

  return next(error)
}

export default errorHandler
