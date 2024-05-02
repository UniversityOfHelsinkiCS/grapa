const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('supervisions', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      thesis_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'theses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      percentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        min: 0,
        max: 100,
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
    await queryInterface.dropTable('supervisions')
  }
}
