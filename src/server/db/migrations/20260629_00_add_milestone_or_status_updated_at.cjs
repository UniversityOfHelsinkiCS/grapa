const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    // 1. Add columns
    await queryInterface.addColumn('theses', 'is_idle', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })

    await queryInterface.sequelize.query(`
      ALTER TABLE theses ADD COLUMN milestone_or_status_updated_at TIMESTAMPTZ;

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

      CREATE TRIGGER thesis_milestone_or_status_changed
      BEFORE UPDATE ON theses
      FOR EACH ROW
      EXECUTE FUNCTION update_milestone_or_status_updated_at();
    `)
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS thesis_milestone_or_status_changed ON theses;
      DROP FUNCTION IF EXISTS update_milestone_or_status_updated_at;
    `)
    await queryInterface.removeColumn('theses', 'milestone_or_status_updated_at')
    await queryInterface.removeColumn('theses', 'is_idle')
  },
}
