const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('study_track_managements', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      study_track_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'study_tracks',
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    })
    
    await queryInterface.addIndex('study_track_managements', ['study_track_id', 'user_id'], {
      unique: true
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('study_track_managements')
  }
}
