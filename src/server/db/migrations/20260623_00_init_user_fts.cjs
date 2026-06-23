module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize
      .query(`ALTER TABLE users ADD COLUMN fts_index tsvector
               GENERATED ALWAYS AS (to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) STORED;`)
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'fts_index')
  },
}
