const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    try {
      await queryInterface.addColumn('study_tracks', 'module_group_id', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    } catch {}
  },
  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('study_tracks', 'module_group_id')
    } catch {}
  },
}