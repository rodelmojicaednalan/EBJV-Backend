'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermissions extends Model {
    static associate(models) {
      RolePermissions.belongsTo(models.roles, {
        foreignKey: 'role_id',
        as: 'role', 
      });

      RolePermissions.belongsTo(models.permissions, {
        foreignKey: 'permission_id',
        as: 'permission', 
      });
    }
  }
  RolePermissions.init({
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles', 
        key: 'id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions', 
        key: 'id'
      }
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'role_permissions',
  });
  return RolePermissions;
};