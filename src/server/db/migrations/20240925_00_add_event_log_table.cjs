const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('event_log', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      thesis_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'theses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
  down: async queryInterface => {
    await queryInterface.dropTable('event_log')
  }
}
