'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserGroups extends Model {
    static associate(models) {
      UserGroups.belongsTo(models.users, {
        foreignKey: 'user_id',
        as: 'user', 
      });
      UserGroups.belongsTo(models.groups, {
        foreignKey: 'group_id',
      });
    }
  }
  UserGroups.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', 
        key: 'id'
      }
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'groups', 
        key: 'id'
      }
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'users_groups',
       indexes: [
      {
        unique: true,
        fields: ['user_id', 'group_id']
      }
    ]
  });
  return UserGroups;
};