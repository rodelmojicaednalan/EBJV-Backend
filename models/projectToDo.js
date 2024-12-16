'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ToDo extends Model {
    static associate(models) {
      ToDo.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      ToDo.belongsTo(models.users, {
        foreignKey: 'user_id', // Tracks which user performed the activity
      });
    }
  }
  
  ToDo.init({
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
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    assignee: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    attachments: {
        type: DataTypes.JSON,
        allowNull: true
    },
    
  }, {
    timestamps: true, // Automatically track when activities occur
    sequelize,
    modelName: 'project_toDos',
    indexes: [
      {
        fields: ['project_id', 'title'], 
      },
    ],
  });

  return ToDo;
};
