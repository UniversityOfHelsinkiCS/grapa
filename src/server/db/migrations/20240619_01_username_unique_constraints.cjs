const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addIndex('users', ['username'], {
      unique: true,
      name: 'unique_username'
    })
  },
  down: async queryInterface => {
    await queryInterface.removeIndex('users', 'unique_username')
  }
}
