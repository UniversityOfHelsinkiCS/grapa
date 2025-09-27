const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('ethesis_admins', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      program_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'programs',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('ethesis_admins')
  }
}
