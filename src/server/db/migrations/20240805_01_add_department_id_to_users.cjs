const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('users', 'department_id', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
      onDelete: 'SET NULL'
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('users', 'department_id')
  }
}
