const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('graders', {
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
      is_primary_grader: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('graders')
  }
}
