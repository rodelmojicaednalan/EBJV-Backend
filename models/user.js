'use strict';
const {Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.roles, {
        through: models.users_roles,
        foreignKey: 'user_id',
      });
      
       User.hasMany(models.projects, {
        foreignKey: 'user_id'
      });
      
      User.hasOne(models.reset_passwords, {
        foreignKey: "user_id"
      });
    }
  }
  
  User.init({
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: false,
      },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email:  {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
      unique: true
    },
    password: {
      type:DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password Required" },
      },
    },
  }, {
    timestamps:true,
    sequelize,
    modelName: 'users',
  });

    User.addHook('beforeSave', async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });
  
  return User;
};

