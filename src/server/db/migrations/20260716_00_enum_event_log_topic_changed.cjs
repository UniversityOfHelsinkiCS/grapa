module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_event_log_type" ADD VALUE 'THESIS_TOPIC_CHANGED';
    `)
  },
  down: async () => {},
}
