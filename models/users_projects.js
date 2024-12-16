'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserProjects extends Model {
    static associate(models) {
      UserProjects.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'user', 
      });
      UserProjects.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
    }
  }
  UserProjects.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects', 
        key: 'id'
      }
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'users_projects',
       indexes: [
      {
        unique: true,
        fields: ['user_id', 'project_id']
      }
    ]
  });
  return UserProjects;
};