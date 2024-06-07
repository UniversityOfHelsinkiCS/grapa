const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('programs', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      level: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      international: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      companionFaculties: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('programs')
  }
}
