'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Permissions extends Model {
    static associate(models) {
      Permissions.belongsToMany(models.roles, {
        through: models.role_permissions,
        foreignKey: 'permission_id',
      });
    }
  }
  Permissions.init({
    permission_name: {
      type: DataTypes.STRING, 
      allowNull: false
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'permissions',
  });
  return Permissions;
};