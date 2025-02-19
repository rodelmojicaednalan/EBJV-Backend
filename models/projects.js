'use strict';
const {Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.users, {
        as: 'owner',
        foreignKey: 'user_id',
      });

      Project.belongsToMany(models.users, {
        through: models.users_projects,
        as: 'collaborators',
        foreignKey: 'project_id',
      });      

      Project.hasMany(models.project_activities, {
        foreignKey: 'project_id'
      });

      Project.hasMany(models.project_views, {
        foreignKey: 'project_id'
      });

      Project.hasMany(models.project_releases, {
        foreignKey: 'project_id'
      });

      Project.hasMany(models.project_toDos, {
        foreignKey: 'project_id'
      });

      Project.hasMany(models.project_topics, {
        foreignKey: 'project_id'
      });

      Project.hasMany(models.groups,{
        foreignKey: 'project_id'
      })

      Project.belongsToMany(models.tags, {
        through: models.projects_tags,
        foreignKey: 'project_id'
      })

    }
  }
  
  Project.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references:{
          model: 'users',
          key: 'id'
      }
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    project_location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project_file: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    properties: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    project_thumbnail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    project_description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    project_boundary: {
      type: DataTypes.STRING,
      allowNull: true
    },
    project_crs: {
      type: DataTypes.STRING,
      allowNull: true
    },
  },
   {
    timestamps:true,
    sequelize,
    modelName: 'projects',
        indexes: [
      {
        unique: true,
        fields: ['project_name']
      }
    ]
  });
  return Project;
};

