'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Topic extends Model {
    static associate(models) {
      Topic.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      Topic.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  Topic.init({
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
    topic_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    topic_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignee: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    topic_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    topic_status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    topic_priority: {
        type: DataTypes.STRING,
        allowNull: false
    },
    topic_dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    assigned_tags: {
        type: DataTypes.JSON,
        allowNull: true
    }
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'project_topics',
    indexes: [
      {
        fields: ['project_id', 'activity_type'], // Index for faster querying by project and activity
      },
    ],
  });

  return Topic;
};
