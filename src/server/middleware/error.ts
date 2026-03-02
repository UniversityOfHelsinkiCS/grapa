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

  if (
    error.name === 'UnauthorizedError' ||
    error.name === 'CustomUnauthorizedError'
  ) {
    res.status(401).send({
      error: error.message,
      data: null,
    })
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
