module.exports = {
  async up(queryInterface) {
    // Remove duplicate study tracks that were created by KOSUs or whatever
    // There are and will be duplicated because some advanced studies are
    // named incorrectly
    await queryInterface.sequelize.query(`
      DELETE FROM study_tracks
      WHERE name->>'en' = 'Geoinformatics, advanced studies';
    `)

    await queryInterface.sequelize.query(`
      DELETE FROM study_tracks
      WHERE name->>'en' = 'Biostatistics and bioinformatics';
    `)
  },
  down: async () => {}
}
