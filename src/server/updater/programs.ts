import { Program } from '../db/models'
import { getOrganisationData } from '../util/jami'
import { safeBulkCreate } from './util'

export const fetchPrograms = async () => {
  const allOrgs = await getOrganisationData()
  const all = allOrgs.map((org) => org.programmes).flat()

  const programs = all.map((program) => ({
    ...program,
    id: program.key,
    enabled: false,
  }))

  await safeBulkCreate({
    entityName: 'Program',
    entities: programs,
    bulkCreate: async (e, opt) => Program.bulkCreate(e, opt),
    fallbackCreate: async (e, opt) => Program.upsert(e, opt),
    options: {
      updateOnDuplicate: [
        'name',
        'level',
        'international',
        'companionFaculties',
      ],
    },
  })
}
