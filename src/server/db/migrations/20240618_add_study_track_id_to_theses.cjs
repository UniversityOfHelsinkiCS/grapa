const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('theses', 'study_track_id', {
      type: DataTypes.STRING,
      allowNull: true,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('theses', 'study_track_id')
  }
}
