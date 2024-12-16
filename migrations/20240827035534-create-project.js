'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('projects',{
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references:{
            model: 'users',
            key: 'id'
        }
      },
      project_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      project_location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      project_file: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      project_thumbnail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      project_size: {
        type: Sequelize.STRING,
        allowNull: true 
      },
      project_folders: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      project_file_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      project_user_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      project_description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      project_boundary: {
        type: Sequelize.STRING,
        allowNull: true
      },
      project_crs: {
        type: Sequelize.STRING,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('projects');
  }
};
