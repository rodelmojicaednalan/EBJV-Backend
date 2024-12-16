'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Group extends Model {
    static associate(models) {
      Group.belongsToMany(models.users, {
        through: models.users_groups,
        foreignKey: 'group_id',
      });

      Group.belongsTo(models.projects, {
          foreignKey: 'project_id'
      })
    }
  }
  Group.init({
    group_name: {
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id'
        }
    }
  }, 
  {
    timestamps: true,  
    sequelize,
    modelName: 'groups',
     indexes: [
      {
        unique: true,
        fields: ['group_name']
      }
    ]
  });
  return Group;
};