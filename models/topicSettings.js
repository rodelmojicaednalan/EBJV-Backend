'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopicSetting extends Model {
    static associate(models) {
      TopicSetting.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      TopicSetting.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  TopicSetting.init({
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
    topicSetting_type: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    topicSetting_status: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    topicSetting_priority: {
        type: DataTypes.JSON,
        allowNull: false,
    },
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'topic_settings',
    indexes: [
      {
        fields: ['project_id', 'user_id'], // Index for faster querying by project and activity
      },
    ],
  });

  return TopicSetting;
};
