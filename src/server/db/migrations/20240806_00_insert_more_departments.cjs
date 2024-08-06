const { DataTypes } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    // insert Department of Physics
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        'ad8a7f5f-2a54-496a-a30e-c0e512508b5d',
        jsonb_build_object('en', 'Department of Physics', 'fi', 'Fysiikan osasto', 'sv', 'Avdelningen för fysik'),
         NOW(),
         NOW()
      )
    `)

    // insert Department of Mathematics and Statistics
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        'c0ce8ca5-6022-471b-a822-5172b1de507d',
        jsonb_build_object('en', 'Department of Mathematics and Statistics', 'fi', 'Matematiikan ja tilastotieteen osasto', 'sv', 'Avdelningen för matematik och statistik'),
         NOW(),
         NOW()
      )
    `)

    // insert Department of Chemistry
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        '202ab77b-9c57-4cd0-a560-25dcd5108d6f',
        jsonb_build_object('en', 'Department of Chemistry', 'fi', 'Kemian osasto', 'sv', 'Avdelningen för kemi'),
         NOW(),
         NOW()
      )
    `)

    // insert Department of Geosciences and Geography
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        '163a5a00-4571-42ac-89a6-7497dee73cbb',
        jsonb_build_object('en', 'Department of Geosciences and Geography', 'fi', 'Geotieteiden ja maantieteen osasto', 'sv', 'Avdelningen för geovetenskaper och geografi'),
         NOW(),
         NOW()
      )
    `)

    // insert "Other" department
    await queryInterface.sequelize.query(`
      INSERT INTO departments (id, name, created_at, updated_at)
      VALUES (
        '305d14cc-6011-4861-b0af-1c9cccb38113',
        jsonb_build_object('en', 'Other', 'fi', 'Muu', 'sv', 'Övrig'),
         NOW(),
         NOW()
      )
    `)
  },
  down: async () => {}
}
