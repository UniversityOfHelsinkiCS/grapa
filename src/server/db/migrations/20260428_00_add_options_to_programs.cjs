const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('programs', 'options', {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('programs', 'options')
  },
}
