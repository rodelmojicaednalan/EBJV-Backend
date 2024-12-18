'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('project_releases', { 
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
        release_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        total_files: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        due_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        recipients: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        release_status: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "Draft"
        },
        release_note: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        assigned_tags: {
          type: Sequelize.JSON,
          allowNull: true
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
      await queryInterface.dropTable('project_releases');
     
  }
};
