'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('project_toDos', { 
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
        title: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        assignee: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        description: {
            type: Sequelize.STRING,
            allowNull: false
        },
        priority: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        due_date: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        status: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: "New"
        },
        attachments: {
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
      await queryInterface.dropTable('project_toDos');
     
  }
};
