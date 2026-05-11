const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('theses', 'ways_of_working_valid_until', {
      type: DataTypes.DATE,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('theses', 'ways_of_working_valid_until')
  },
}
