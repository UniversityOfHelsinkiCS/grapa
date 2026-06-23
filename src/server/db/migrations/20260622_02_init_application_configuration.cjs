// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('application_configuration', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('application_configuration')
  },
}
