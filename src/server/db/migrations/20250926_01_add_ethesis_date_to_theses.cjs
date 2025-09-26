const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('theses', 'ethesis_date', {
      type: DataTypes.DATE,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('theses', 'ethesis_date')
  },
}
