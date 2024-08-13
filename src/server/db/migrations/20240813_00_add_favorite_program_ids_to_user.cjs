const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'favorite_program_ids', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: []
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'favorite_program_ids')
  }
}
