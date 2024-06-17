const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    // add unique index to study_tracks on name and program_id columns
    await queryInterface.addIndex('study_tracks', ['name', 'program_id'], {
      unique: true,
      name: 'study_tracks_name_program_id_unique_index',
    })
  },
  down: async queryInterface => {
    await queryInterface.removeIndex('study_tracks', 'study_tracks_name_program_id_unique_index')
  }
}
