'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserRoles extends Model {
    static associate(models) {
      UserRoles.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'user', 
      });
      UserRoles.belongsTo(models.roles, {
        foreignKey: 'role_id',
      });
    }
  }
  UserRoles.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles', 
        key: 'id'
      }
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'users_roles',
       indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id']
      }
    ]
  });
  return UserRoles;
};