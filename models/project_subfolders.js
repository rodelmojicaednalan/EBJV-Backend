'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ProjectSubfolder extends Model {
        static associate(models) {
            ProjectSubfolder.belongsTo(models.projects, {
                foreignKey: 'project_id',
                as: 'project'
            });
        }
    }

    ProjectSubfolder.init({
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id'
            }
        },
        folder_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        folder_path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        timestamps: true,
        sequelize,
        modelName: 'project_subfolders',
    });

    return ProjectSubfolder;
};
