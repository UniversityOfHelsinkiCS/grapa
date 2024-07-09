const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addIndex('program_managements', ['program_id', 'user_id'], {
      unique: true,
      name: 'program_managements_unique_program_id_user_id_index'
    })
  },
  down: async queryInterface => {
    await queryInterface.removeIndex('program_managements', 'program_managements_unique_program_id_user_id_index')
  }
}
