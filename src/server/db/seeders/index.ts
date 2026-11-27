import logger from '../../util/logger.ts'
import seedUsers from './user.ts'

const seed = async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 1_000))

  try {
    await seedUsers()
    logger.info('Seeding successful')
  } catch (e) {
    logger.error('Seeding failed: ', e)
  }
}

export default seed
