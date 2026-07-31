import { toIncludeSameMembers } from 'jest-extended'
import { expect, afterEach } from 'vitest'

import {
  Attachment,
  Author,
  EthesisAdmin,
  EventLog,
  Grader,
  Program,
  ProgramManagement,
  StudyTrack,
  Supervision,
  Thesis,
  User,
} from './src/server/db/models'

expect.extend({ toIncludeSameMembers })

afterEach(async () => {
  await Attachment.destroy({ where: {} })
  await Supervision.destroy({ where: {} })
  await Author.destroy({ where: {} })
  await Thesis.destroy({ where: {} })
  await EthesisAdmin.destroy({ where: {} })
  await User.destroy({ where: {} })
  await StudyTrack.destroy({ where: {} })
  await Program.destroy({ where: {} })
  await Grader.destroy({ where: {} })
  await ProgramManagement.destroy({ where: {} })
  await EventLog.destroy({ where: {} })
  // TODO: Departments should be cleaned up here too,
  // but integration tests are failing atm if I do it here.
  // We need to fix department / department admin integration tests
  // and add the cleanup here.
})
