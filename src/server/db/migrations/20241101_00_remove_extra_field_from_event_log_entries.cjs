module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE event_log
      SET data = jsonb_set(
        data,
        '{updatedGraders}',
        (
          SELECT jsonb_agg(
            elem - 'isExternal'
          )
          FROM jsonb_array_elements(data->'updatedGraders') AS elem
        )
      )
      WHERE type = 'THESIS_GRADERS_CHANGED';
    `)

    await queryInterface.sequelize.query(`
      UPDATE event_log
      SET data = jsonb_set(
        data,
        '{updatedSupervisions}',
        (
          SELECT jsonb_agg(
            elem - 'isExternal'
          )
          FROM jsonb_array_elements(data->'updatedSupervisions') AS elem
        )
      )
      WHERE type = 'THESIS_SUPERVISIONS_CHANGED';
    `)
  },
  down: async () => {}
}
