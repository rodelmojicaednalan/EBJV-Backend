'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectView extends Model {
    static associate(models) {
      ProjectView.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      ProjectView.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  ProjectView.init({
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
    view_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    view_description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    assigned_tags: {
      type: DataTypes.JSON,
      allowNull: true
  }
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'project_views',
    indexes: [
      {
        fields: ['project_id', 'view_name'], // Index for faster querying by project and activity
      },
    ],
  });

  return ProjectView;
};
