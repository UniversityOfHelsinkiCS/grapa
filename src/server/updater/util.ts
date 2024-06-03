/* eslint-disable no-restricted-syntax */
import * as Sentry from '@sentry/node'

import { redis } from '../util/redis'
import logger from '../util/logger'

const logError = (message: string, error: Error) => {
  logger.error(`${message} ${error.name}, ${error.message}`)

  Sentry.captureException(error)
}

interface BulkCreateOptions {
  entityName: string
  bulkCreate: (entities: object[], options: any) => Promise<any>
  fallbackCreate: (entity: object, options: any) => Promise<any>
  options: Record<string, any>
  entities: Record<string, any>[]
}
export const safeBulkCreate = async ({
  entityName,
  bulkCreate,
  fallbackCreate,
  options,
  entities,
}: BulkCreateOptions) => {
  try {
    const result = await bulkCreate(entities, options)
    return result
  } catch (bulkCreateError: any) {
    const result = []
    logError(
      `[UPDATER] ${entityName}.bulkCreate failed, reason: `,
      bulkCreateError
    )
    logger.info(`[UPDATER] Creating ${entityName}s one by one`)
    for (const entity of entities) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fallbackCreate(entity, {
          ...options,
          fields: options.updateOnDuplicate,
        })
        result.push(res)
      } catch (fallbackCreateError: any) {
        logError(
          `[UPDATER] Fallback could not create ${entityName} (${JSON.stringify(
            entity
          )}), reason:`,
          fallbackCreateError
        )
      }
    }
    return result
  }
}

export const clearOffsets = async () => {
  const keys = await redis.keys('*-offset')

  for (const key of keys) {
    // eslint-disable-next-line no-await-in-loop
    await redis.del(key)
  }
}
