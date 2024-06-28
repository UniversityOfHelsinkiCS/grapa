const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('users', 'employee_number', {
      type: DataTypes.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('users', 'student_number', {
      type: DataTypes.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('users', 'has_study_right', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'employee_number')
    await queryInterface.removeColumn('users', 'student_number')
    await queryInterface.removeColumn('users', 'has_study_right')
  },
}
