const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'iam_groups', {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'iam_groups')
  }
}
