'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('project_activities', { 
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
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true, // Allow null for system-generated events
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        activity_type: {
          type: Sequelize.ENUM('Project Created', 'File Uploaded', 'File Deleted', 
          'Release Created', 'Release Deleted', 'Topic Created', 'Topic Deleted',
          'Comment Added', 'Status Changed'),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true, // Optional additional details
        },
        related_data: {
          type: Sequelize.JSON, // Store related data (e.g., file name, comment content)
          allowNull: true,
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
      await queryInterface.dropTable('project_activities');
     
  }
};
