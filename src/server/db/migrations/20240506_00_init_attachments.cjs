const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('attachments', {
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
      file_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      original_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label: {
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
  down: async queryInterface => {
    await queryInterface.dropTable('attachment')
  }
}
