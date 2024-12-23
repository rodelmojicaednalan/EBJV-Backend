'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('project_topics', { 
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
          allowNull: true, 
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        topic_name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        topic_description: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        assignee: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        topic_type: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        topic_status: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        topic_priority: {
            type: Sequelize.STRING,
            allowNull: false
        },
        topic_dueDate: {
            type: Sequelize.DATE,
            allowNull: false,
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
      await queryInterface.dropTable('project_topics');
     
  }
};
