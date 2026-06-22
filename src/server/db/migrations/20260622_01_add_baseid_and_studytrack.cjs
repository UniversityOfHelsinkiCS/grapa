const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('study_rights', 'base_id', {
      type: DataTypes.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('study_rights', 'study_track_id', {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'study_tracks',
        key: 'sisu_id',
      },
      onDelete: 'CASCADE',
    })
    await queryInterface.addColumn('study_rights', 'study_track_code', {
      type: DataTypes.STRING,
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('study_rights', 'base_id')
    await queryInterface.removeColumn('study_rights', 'study_track_id')
    await queryInterface.removeColumn('study_rights', 'study_track_code')
  },
}
