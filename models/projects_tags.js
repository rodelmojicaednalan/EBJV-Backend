'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProjectTags extends Model {
    static associate(models) {
      ProjectTags.belongsTo(models.projects, {
        foreignKey: 'project_id',
      });
      ProjectTags.belongsTo(models.tags, {
        foreignKey: 'tag_id',
      });
    }
  }
  ProjectTags.init({
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects', 
        key: 'id'
      }
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tags', 
        key: 'id'
      }
    },
    attachment: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    timestamps:true,
    sequelize,
    modelName: 'projects_tags',
       indexes: [
      {
        unique: true,
        fields: ['project_id', 'tag_id']
      }
    ]
  });
  return ProjectTags;
};