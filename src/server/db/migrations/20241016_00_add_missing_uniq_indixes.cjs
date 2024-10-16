const { DataTypes } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('approvers', ['user_id', 'thesis_id'], {
      unique: true,
      name: 'approvers_user_id_thesis_id_unique_index',
    })

    await queryInterface.addIndex('authors', ['thesis_id', 'user_id'], {
      unique: true,
      name: 'authors_thesis_id_user_id_unique_index',
    })

    await queryInterface.addIndex('graders', ['thesis_id', 'user_id'], {
      unique: true,
      name: 'graders_thesis_id_user_id_unique_index',
    })

    await queryInterface.addIndex('supervisions', ['user_id', 'thesis_id'], {
      unique: true,
      name: 'supervisions_user_id_thesis_id_unique_index',
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex(
      'approvers',
      'approvers_user_id_thesis_id_unique_index'
    )
    await queryInterface.removeIndex(
      'authors',
      'authors_thesis_id_user_id_unique_index'
    )
    await queryInterface.removeIndex(
      'graders',
      'graders_thesis_id_user_id_unique_index'
    )
    await queryInterface.removeIndex(
      'supervisions',
      'supervisions_user_id_thesis_id_unique_index'
    )
  },
}
