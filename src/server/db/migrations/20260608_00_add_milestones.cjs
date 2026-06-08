const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('theses', 'milestone', {
      type: DataTypes.INTEGER,
      allowNull: true,
    })

    await queryInterface.addColumn('theses', 'milestone_version', {
      type: DataTypes.INTEGER,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('theses', 'milestone')
    await queryInterface.removeColumn('theses', 'milestone_version')
  },
}
