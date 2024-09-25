const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('event_log', 'type', {
      type: DataTypes.ENUM([
        'THESIS_CREATED',
        'THESIS_DELETED',
        'THESIS_SUPERVISIONS_CHANGED',
        'THESIS_GRADERS_CHANGED',
        'THESIS_STATUS_CHANGED',
      ]),
      allowNull: true,
    })
    await queryInterface.addColumn('event_log', 'data', {
      type: DataTypes.JSONB(),
      allowNull: true,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('event_log', 'type')
    await queryInterface.removeColumn('event_log', 'data')
  },
}
