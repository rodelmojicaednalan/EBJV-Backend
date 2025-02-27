'use strict';
const bcrypt = require('bcryptjs'); // Import bcrypt

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the passwords before inserting
    const hashedSuperAdminPassword = await bcrypt.hash('zKr4!X=134', 10);
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    const hashedClientPassword = await bcrypt.hash('password', 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          first_name: 'Super',
          last_name: 'Admin',
          username: 'Superadmin',
          email: 'superadmin@api-cadstream.ebjv.e-fab.com.au',
          password: hashedSuperAdminPassword,
          "createdAt": new Date(),
          "updatedAt": new Date() 
        },
        {
          first_name: 'Admin',
          last_name: 'User',
          username: 'admin',
          email: 'admin@api-cadstream.ebjv.e-fab.com.au',
          password: hashedAdminPassword,
          "createdAt": new Date(),
          "updatedAt": new Date() 
        },
        {
          first_name: 'Sample',
          last_name: 'Client',
          username: 'client',
          email: 'sampleclient@email.com',
          password: hashedClientPassword,
          "createdAt": new Date(),
          "updatedAt": new Date()
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
