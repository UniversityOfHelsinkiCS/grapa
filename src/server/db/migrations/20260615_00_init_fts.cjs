module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize
      .query(`ALTER TABLE theses ADD COLUMN fts_index tsvector
               GENERATED ALWAYS AS (to_tsvector('simple', coalesce(topic, ''))) STORED;`)
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('theses', 'fts_index')
  },
}
