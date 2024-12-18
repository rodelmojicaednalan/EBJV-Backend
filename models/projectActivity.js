'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectActivity extends Model {
    static associate(models) {
      ProjectActivity.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      ProjectActivity.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  ProjectActivity.init({
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
    activity_type: {
      type: DataTypes.ENUM('Project Created', 'File Uploaded', 'File Deleted', 
      'Release Created', 'Release Deleted', 'Topic Created', 'Topic Deleted',
      'Comment Added', 'Status Changed'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // Optional additional details
    },
    related_data: {
      type: DataTypes.JSON, // Store related data (e.g., file name, comment content)
      allowNull: true,
    },
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'project_activities',
    indexes: [
      {
        fields: ['project_id', 'activity_type'], // Index for faster querying by project and activity
      },
    ],
  });

  return ProjectActivity;
};
