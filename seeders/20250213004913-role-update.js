'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Check if the "Superadmin" role already exists
      const [existingSuperadmin] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE role_name = 'Superadmin' LIMIT 1;`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // If the role does not exist, insert it
      if (!existingSuperadmin) {
        await queryInterface.bulkInsert(
          'roles',
          [{
            role_name: 'Superadmin',
            role_description: 'Full access to all site functionalities',
            createdAt: new Date(),
            updatedAt: new Date()
          }],
          { transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', { role_name: 'Superadmin' }, {});
  }
};
