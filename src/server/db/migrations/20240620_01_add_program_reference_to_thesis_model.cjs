module.exports = {
  up: async (queryInterface) => {
    queryInterface.addConstraint('theses', {
      fields: ['program_id'],
      type: 'foreign key',
      name: 'theses_program_id_fkey',
      references: {
        table: 'programs',
        field: 'id',
      },
    })
  },
  down: async (queryInterface) => {
    queryInterface.removeConstraint('theses', 'theses_program_id_fkey')
  },
}
