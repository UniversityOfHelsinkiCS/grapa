module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_theses_status" ADD VALUE 'SUGGESTED';
    `)
  },
  down: async () => { },
}
