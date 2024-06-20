import { toIncludeSameMembers } from 'jest-extended'
import { jest } from '@jest/globals'
import {
  Attachment,
  Author,
  Program,
  StudyTrack,
  Supervision,
  Thesis,
  User,
} from './src/server/db/models'

expect.extend({ toIncludeSameMembers })

global.jest = jest

global.afterEach(async () => {
  await Attachment.destroy({ where: {} })
  await Supervision.destroy({ where: {} })
  await Author.destroy({ where: {} })
  await Thesis.destroy({ where: {} })
  await User.destroy({ where: {} })
  await StudyTrack.destroy({ where: {} })
  await Program.destroy({ where: {} })
})
