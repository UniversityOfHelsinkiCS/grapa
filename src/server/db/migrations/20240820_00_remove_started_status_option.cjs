const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    // remove the 'started' option from the status column of theses table
    await queryInterface.changeColumn('theses', 'status', {
      type: DataTypes.ENUM,
      values: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      allowNull: false,
    })
  },
  down: async queryInterface => {
    // add the 'started' option back to the status column of theses table
    await queryInterface.changeColumn('theses', 'status', {
      type: DataTypes.ENUM,
      values: ['PLANNING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      allowNull: false,
    })
  }
}
