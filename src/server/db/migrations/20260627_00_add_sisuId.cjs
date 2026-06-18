const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('study_tracks', 'sisu_id', {
      type: DataTypes.STRING,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('study_tracks', 'sisu_id')
  },
}
