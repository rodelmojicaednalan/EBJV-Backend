'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

      await queryInterface.bulkInsert('roles', 
    [
      {
        role_name: 'Superadmin',
        role_description: 'Full access to all site functionalities',
        "createdAt": new Date(),
        "updatedAt": new Date()
       },

     {
      role_name: 'Admin',
      role_description: 'Can only manage projects and contributors and has no control over user accounts and role management.',
      "createdAt": new Date(),
      "updatedAt": new Date()
     },
    
     {
      role_name: 'Client',
      role_description: 'Has view-only access to projects, folders, files and models',
      "createdAt": new Date(),
      "updatedAt": new Date()
     },

    ], {});
    
  },

  async down (queryInterface, Sequelize) {

     await queryInterface.bulkDelete('roles', null, {});
     
  }
};
