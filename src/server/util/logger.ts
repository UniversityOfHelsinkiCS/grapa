import winston from 'winston'
import LokiTransport from 'winston-loki'

import { inProduction } from '../../config'

const { combine, timestamp, printf, splat } = winston.format

const LOKI_HOST =
  process.env.LOKI_HOST ??
  `https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/lokki`
const LOKI_TOKEN = process.env.LOKI_TOKEN ?? ''

const transports = []

transports.push(new winston.transports.File({ filename: 'debug.log' }))

if (!inProduction) {
  const devFormat = printf(
    ({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`
  )

  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: combine(splat(), timestamp(), devFormat),
    })
  )
} else {
  const levels: { [key: string]: number } = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  }

  const prodFormat = winston.format.printf(({ level, ...rest }) =>
    JSON.stringify({
      level: levels[level],
      ...rest,
    })
  )
  transports.push(new winston.transports.Console({ format: prodFormat }))

  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      headers: {
        token: LOKI_TOKEN,
      },
      labels: {
        app: 'grapa',
        environment: process.env.NODE_ENV || 'production',
      },
    })
  )
}

const logger = winston.createLogger({ transports })

export default logger
