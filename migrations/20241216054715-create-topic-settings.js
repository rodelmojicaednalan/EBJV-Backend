'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('topic_settings', { 
       id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
       },
       project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Allow null for system-generated events
        references: {
          model: 'users',
          key: 'id',
        },
      },
      topicSetting_type: {
          type: Sequelize.JSON,
          allowNull: false,
      },
      topicSetting_status: {
          type: Sequelize.JSON,
          allowNull: false,
      },
      topicSetting_priority: {
          type: Sequelize.JSON,
          allowNull: false,
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
     await queryInterface.dropTable('topic_settings');
    
  }
};
