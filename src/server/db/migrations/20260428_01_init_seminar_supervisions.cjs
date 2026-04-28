const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('seminar_supervisions', {
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
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex(
      'seminar_supervisions',
      ['user_id', 'thesis_id'],
      {
        unique: true,
        name: 'seminar_supervisions_user_id_thesis_id_unique_index',
      }
    )
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'seminar_supervisions',
      'seminar_supervisions_user_id_thesis_id_unique_index'
    )
    await queryInterface.dropTable('seminar_supervisions')
  },
}
