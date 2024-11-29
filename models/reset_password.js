'use strict';
const {Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ResetPassword extends Model {
    static associate(models) {
      ResetPassword.belongsTo(models.users, {
        foreignKey: 'user_id',
      });
    }
  }
  
  ResetPassword.init({
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: 'users',
            key: 'id'
        }
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }

  }, {
    timestamps:true,
    sequelize,
    modelName: 'reset_passwords',
  });
  
  return ResetPassword;
};

