'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      { permission_name: 'Manage Accounts', "createdAt": new Date(), "updatedAt": new Date()},
      { permission_name: 'Manage Roles', "createdAt": new Date(), "updatedAt": new Date() },
      { permission_name: 'Manage Projects', "createdAt": new Date(), "updatedAt": new Date() },
      { permission_name: 'Manage Profile', "createdAt": new Date(), "updatedAt": new Date() },
      { permission_name: 'View-Only Access', "createdAt": new Date(), "updatedAt": new Date() }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
