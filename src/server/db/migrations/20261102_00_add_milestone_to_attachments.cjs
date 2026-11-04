const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('attachments', 'milestone', {
      type: DataTypes.INTEGER,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('attachments', 'milestone')
  },
}
