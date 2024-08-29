const { DataTypes, UUIDV4 } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('department_admins', {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      department_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

    })

    await queryInterface.addIndex('department_admins', ['department_id', 'user_id'], {
      unique: true,
      name: 'departments_admins_unique_department_id_user_id_index'
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('department_admins')
    await queryInterface.removeIndex('department_admins', 'departments_admins_unique_department_id_user_id_index')
  }
}
