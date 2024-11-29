'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Roles extends Model {
    static associate(models) {
      Roles.belongsToMany(models.users, {
        through: models.users_roles,
        foreignKey: 'role_id',
      });
      Roles.belongsToMany(models.permissions, {
        through: models.role_permissions,
        foreignKey: 'role_id',
      });
    }
  }
  Roles.init({
    role_name: {
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true
    },
    role_description: {
      type: DataTypes.STRING,
      allowNull:true
    },
  }, 
  {
    timestamps: true,  
    sequelize,
    modelName: 'roles',
     indexes: [
      {
        unique: true,
        fields: ['role_name']
      }
    ]
  });
  return Roles;
};