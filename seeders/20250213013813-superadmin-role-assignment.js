'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

     await queryInterface.bulkInsert('role_permissions', [
       { role_id: 6, permission_id: 2, "createdAt": new Date(), "updatedAt": new Date() },
       { role_id: 6, permission_id: 4, "createdAt": new Date(), "updatedAt": new Date() },
       { role_id: 6, permission_id: 7, "createdAt": new Date(), "updatedAt": new Date() },
       { role_id: 6, permission_id: 8, "createdAt": new Date(), "updatedAt": new Date() },
       { role_id: 6, permission_id: 9, "createdAt": new Date(), "updatedAt": new Date() },

      ], {});
  },

  async down (queryInterface, Sequelize) {

     await queryInterface.bulkDelete('role_permissions', null, {});
     
  }
};
