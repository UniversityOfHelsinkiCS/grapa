import { createClient } from 'redis'
import { RedisStore } from 'connect-redis'

import { REDIS_HOST } from './config'

const ttl = 60 * 60 * 24 * 30 // 30 days

export const redis = createClient({
  socket: { host: REDIS_HOST, port: 6379 },
})

await redis.connect()

export const redisStore = new RedisStore({
  client: redis,
})

export const set = async (key: string, value: any) => {
  await redis.set(key, JSON.stringify(value), { EX: ttl })
}

export const get = async (key: string): Promise<any | null> => {
  const value = await redis.get(key)

  if (!value) return null

  return JSON.parse(value)
}
