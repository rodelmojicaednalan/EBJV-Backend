'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StaffLog extends Model {
    static associate(models) {
      StaffLog.belongsTo(models.users, {
        foreignKey: 'user_id',
      });
    }
  }

  StaffLog.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
        model:'users',
        key:'id'
      }
    },
    action: {
      type: DataTypes.ENUM('login', 'logout'),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: true,
    sequelize,
    modelName: 'staff_logs',
  });

  return StaffLog;
};
