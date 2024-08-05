const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('theses', 'department_id')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('theses', 'department_id', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
      onDelete: 'SET NULL'
    })
  }
}
