const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    // insert department of computer science
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        '8fdce98e-2e9e-4cd7-a4c3-6d0176e29d37',
        jsonb_build_object('en', 'Department of Computer Science', 'fi', 'Tietojenkäsittelytieteen osasto', 'sv', 'Avdelningen för datavetenskap'),
         NOW(),
         NOW()
      )
    `)
  },
  down: async () => {}
}
