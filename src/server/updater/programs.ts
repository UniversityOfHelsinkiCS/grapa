import { Program, StudyTrack } from '../db/models'
import { fetchData } from './importerClient'
import { safeBulkCreate } from './util'

const studyTracksInsert = async (studyTracks: any[]) => {
  const existingTracks = await StudyTrack.findAll()

  const sisuIds = existingTracks
    .map((studytrack) => studytrack.sisuId)
    .filter((sisuId) => sisuId)
  const module_data = (await fetchData('modules', {
    limit: sisuIds.length,
    offset: 0,
    ids: sisuIds,
  })) as any[]

  const counters = {
    migrated: 0,
    legacy: 0,
    update: 0,
    total: studyTracks.length,
    new: 0,
    legacy_set: new Set(),
    update_set: new Set(),
    new_set: new Set(),
    migrated_set: new Set(),
  }

  // This migrates modules with sisuIds to use the new format
  module_data.forEach((module) => {
    const track = existingTracks.find((t) => t.sisuId === module.id)
    if (track && !track.moduleGroupId) {
      console.log('Needs migrating', module.id, module.name.fi, module.code)
      void track.update({
        code: module.code,
        moduleGroupId: module.id,
        name: module.name,
      })
      counters.migrated++
      counters.migrated_set.add(module.code)
      console.log('Migrated\n\n')
    }
  })

  for (const index in studyTracks) {
    const studytrack = studyTracks[index]

    // Modern
    // Using module group id and codes of the program and studytrack
    let track = existingTracks.find(
      (t) =>
        t.moduleGroupId === studytrack.moduleGroupId &&
        t.programId === studytrack.programId &&
        t.code === studytrack.code
    )

    // Modern legacy
    if (!track) {
      // Using module ID (exactly same module)
      track = existingTracks.find((t) => t.sisuId === studytrack.sisuId)
    }

    counters.update += Number(track != undefined)

    console.log(
      'Track',
      studytrack.programId,
      studytrack.code,
      studytrack.sisuId
    )
    let isOld = false

    // Handle very legacy cases
    if (!track) {
      // Fallback: match by old name & program code to backfill sisuId
      track = existingTracks.find(
        (t) =>
          t.programId === studytrack.programId &&
          t.name?.fi?.toLocaleLowerCase() ===
            studytrack.name?.fi?.toLocaleLowerCase() &&
          t.name?.en.toLocaleLowerCase() ===
            studytrack.name?.en?.toLocaleLowerCase()
      )

      isOld = track != undefined
      counters.legacy += Number(track != undefined)
      console.log('Legacy match', isOld, isOld ? track.id : null)
    }

    if (track) {
      // Update sisuId and name if it changed
      if (isOld) {
        counters.legacy_set.add(studytrack.programId + '/' + studytrack.code)
        // Here we update the module id if it's gone bad and the module is only found through legacy matching
        // This updates the studytrack so it can be matched by the modern method
        await track.update({
          code: studytrack.code,
          name: studytrack.name,
          programId: studytrack.programId,
          moduleGroupId: studytrack.moduleGroupId,
        })
      } else {
        // This is used when a modern or modern legacy match was found
        // We should make sure the code, moduleGroupId and sisuId are set and update the studyright with the sisu data
        await track.update({
          code: studytrack.code,
          moduleGroupId: studytrack.moduleGroupId,
          name: studytrack.name,
          programId: studytrack.programId,
        })
        counters.update_set.add(studytrack.programId + '/' + studytrack.code)
      }
    } else {
      counters.new += 1
      counters.new_set.add(studytrack.programId + '/' + studytrack.code)

      // Here we create a entirely new studytrack, this is only executed if no check finds any matches
      await StudyTrack.create({
        code: studytrack.code,
        moduleGroupId: studytrack.moduleGroupId,
        name: studytrack.name,
        programId: studytrack.programId,
      })
    }
  }
  console.log('Counters', {
    ...counters,
    legacy_set: null,
    update_set: null,
    new_set: null,
    migrated_set: null,
  })
  console.log('\n\nLegacy\n\n', Array.from(counters.legacy_set).join('\n'))
  console.log('\n\nUpdate\n\n', Array.from(counters.update_set).join('\n'))
  console.log('\n\nNew\n\n', Array.from(counters.new_set).join('\n'))
  console.log('\nMigrated\n\n', Array.from(counters.migrated_set).join('\n'))
}

export const programHandler = async (programs: any) => {
  const parsed_programs = Object.keys(programs).map((code) => {
    return {
      id: code,
      enabled: false,
      name: programs[code].name,
      level: programs[code].level
        ? programs[code].level
        : code.includes('KH')
          ? 'bachelor'
          : 'master',

      // these do not seem to be acually used anywhere,
      // they are probably leftovers from jami
      international: true,
      companionFaculties: [] as string[],
    }
  })

  const studytracks = Object.keys(programs)
    .map((code) => {
      return Object.keys(programs[code].children).map((child) => {
        const module = programs[code].children[child]
        return {
          code: module.code,
          programId: code,
          sisuId: module.id,
          name: module.name,
          moduleGroupId: module.group_id,
        }
      })
    })
    .flat()

  await safeBulkCreate({
    entityName: 'Program',
    entities: parsed_programs,
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

  await studyTracksInsert(studytracks)
}

export const fetchPrograms = async () => {
  const data = await fetchData('programs')
  await programHandler(data)
}
