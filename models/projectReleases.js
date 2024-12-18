'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectRelease extends Model {
    static associate(models) {
      ProjectRelease.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      ProjectRelease.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  ProjectRelease.init({
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for system-generated events
      references: {
        model: 'users',
        key: 'id',
      },
    },
    release_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_files: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    recipients: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    release_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Draft"
    },
    release_note: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    assigned_tags: {
      type: DataTypes.JSON,
      allowNull: true
  }
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'project_releases',
    indexes: [
      {
        fields: ['project_id', 'release_name'], // Index for faster querying by project and activity
      },
    ],
  });

  return ProjectRelease;
};
