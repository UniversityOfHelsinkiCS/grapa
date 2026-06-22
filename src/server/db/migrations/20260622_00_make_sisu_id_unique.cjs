const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE study_tracks ADD CONSTRAINT sisu_id_unique UNIQUE (sisu_id)`
    )
  },
  down: async (queryInterface) => {
    await queryInterface.changeColumn('study_tracks', 'sisu_id', {
      unique: false,
    })
  },
}
