'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      Tag.belongsToMany(models.projects, {
        through: models.projects_tags,
        foreignKey: 'tag_id',
      });

    }
  }
  Tag.init({
    tag_name: {
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true
    },
  }, 
  {
    timestamps: true,  
    sequelize,
    modelName: 'tags',
  });
  return Tag;
};