module.exports = {
  up: async (queryInterface) => {
    queryInterface.addConstraint('theses', {
      fields: ['study_track_id'],
      type: 'foreign key',
      name: 'study_track_id_fkey',
      references: {
        table: 'study_tracks',
        field: 'id',
      },
    })
  },
  down: async (queryInterface) => {
    queryInterface.removeConstraint('theses', 'study_track_id_fkey')
  },
}
