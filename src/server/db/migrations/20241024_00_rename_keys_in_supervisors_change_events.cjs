module.exports = {
  async up(queryInterface) {
    // Rename keys in THESIS_SUPERVISIONS_CHANGED event data
    // originalGraders -> originalSupervisions
    // updatedGraders -> updatedSupervisions
    await queryInterface.sequelize.query(`
      UPDATE event_log
      SET data = jsonb_set(
        jsonb_set(
          data,
          '{originalSupervisions}',
          data->'originalGraders'
        ) - 'originalGraders',
        '{updatedSupervisions}',
        data->'updatedGraders'
      ) - 'updatedGraders'
      WHERE type = 'THESIS_SUPERVISIONS_CHANGED'
      AND data ? 'originalGraders'
      AND data ? 'updatedGraders'
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE event_log
      SET data = jsonb_set(
        jsonb_set(
          data,
          '{originalGraders}',
          data->'originalSupervisions'
        ) - 'originalSupervisions',
        '{updatedGraders}',
        data->'updatedSupervisions'
      ) - 'updatedSupervisions'
      WHERE type = 'THESIS_SUPERVISIONS_CHANGED'
      AND data ? 'originalSupervisions'
      AND data ? 'updatedSupervisions'
    `)
  },
}
