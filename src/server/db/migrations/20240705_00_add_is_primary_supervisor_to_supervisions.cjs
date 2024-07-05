const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('supervisions', 'is_primary_supervisor', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('supervisions', 'is_primary_supervisor')
  }
}
