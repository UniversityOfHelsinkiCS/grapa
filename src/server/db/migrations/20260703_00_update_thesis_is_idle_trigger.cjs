module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_milestone_or_status_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.milestone IS DISTINCT FROM NEW.milestone OR OLD.status IS DISTINCT FROM NEW.status OR (OLD.is_idle = true AND NEW.is_idle = false) THEN
          NEW.milestone_or_status_updated_at = NOW();
          NEW.is_idle = false;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_milestone_or_status_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.milestone IS DISTINCT FROM NEW.milestone OR OLD.status IS DISTINCT FROM NEW.status THEN
          NEW.milestone_or_status_updated_at = NOW();
          NEW.is_idle = false;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
  },
}
