'use strict';
const {Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.users, {
        foreignKey: 'user_id',
      });
    }
  }
  
  Project.init({
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    project_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
          model: 'users',
          key: 'id'
      }
    },
    project_status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    },
    project_file: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    timestamps:true,
    sequelize,
    modelName: 'projects',
        indexes: [
      {
        unique: true,
        fields: ['project_name']
      }
    ]
  });
  return Project;
};

