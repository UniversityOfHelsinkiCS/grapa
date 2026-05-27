// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('study_rights', {
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
        onDelete: 'CASCADE',
      },
      program_code: {
        type: DataTypes.STRING,
        allowNull: false,
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
      start_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.STRING,
        allowNull: true,
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
    await queryInterface.dropTable('study_rights')
  },
}
