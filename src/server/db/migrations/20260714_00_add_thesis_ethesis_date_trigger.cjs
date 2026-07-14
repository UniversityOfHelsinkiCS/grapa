module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_ethesis_date()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status IN ('ETHESIS_SENT', 'ETHESIS') AND OLD.status IS DISTINCT FROM NEW.status THEN
          NEW.ethesis_date = NOW();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS thesis_ethesis_date_changed ON theses;
      CREATE TRIGGER thesis_ethesis_date_changed
      BEFORE UPDATE ON theses
      FOR EACH ROW
      EXECUTE FUNCTION update_ethesis_date();
    `)
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS thesis_ethesis_date_changed ON theses;
      DROP FUNCTION IF EXISTS update_ethesis_date;
    `)
  },
}
