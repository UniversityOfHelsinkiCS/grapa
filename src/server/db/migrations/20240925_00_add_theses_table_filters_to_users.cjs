const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'theses_table_filters', {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      allowNull: false,
      defaultValue: []
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'theses_table_filters')
  }
}
