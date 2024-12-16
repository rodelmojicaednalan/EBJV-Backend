'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('groups', { 
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        group_name: {
          type: Sequelize.STRING, 
          allowNull: false,
          unique: true
        },
        project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id'
            }
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
     
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('groups');
    
  }
};
