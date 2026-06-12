const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('departments', 'enabled', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('departments', 'enabled')
  },
}
