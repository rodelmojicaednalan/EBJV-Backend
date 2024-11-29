'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

      await queryInterface.bulkInsert('roles', [{
      role_name: 'Admin',
      role_description: 'Admin Access',
      "createdAt": new Date(),
      "updatedAt": new Date()
     },
    
    
      {
        role_name: 'Client',
        role_description: 'User Access',
        "createdAt": new Date(),
        "updatedAt": new Date()
      },

    ], {});
    
  },

  async down (queryInterface, Sequelize) {

     await queryInterface.bulkDelete('roles', null, {});
     
  }
};
