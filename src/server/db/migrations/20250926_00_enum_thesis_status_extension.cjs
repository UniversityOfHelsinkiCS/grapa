module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_theses_status" ADD VALUE 'ETHESIS_SENT';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_theses_status" ADD VALUE 'ETHESIS';
    `)
  },
  down: async () => {},
}
