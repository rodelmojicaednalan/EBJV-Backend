const {projects, users, project_activities, project_views, 
    project_releases, project_topics, users_projects, staff_logs, roles,
    project_toDos} = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
//const e = require('cors');

const getAllprojects = async (req, res) => {
    try {
        const allprojects = await projects.findAll({
            include: [
                {
                    model: users,
                    as: 'owner',
                    attributes: ['first_name', 'last_name']
                }
            ],
            attributes: ['id', 'project_name', 'project_location', 'project_file'],
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json({data:allprojects});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectByLoggedInUser = async (req, res) => {
    try{
        const userId = req.user.id;
        const currentProjects = await projects.findAll({
            where: {user_id: userId},
            order: [['updatedAt', 'DESC']],
            include: [
                {
                model: users,
                as: 'owner',
                attributes: ['first_name', 'last_name']
                }
                ]
        })
        res.status(200).json({data: currentProjects});
    } catch (error){
        res.status(500).json({message: 'Error fetching projects', error: error.message})
    }
};

const getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await projects.findByPk(id, {
            include: [
                {
                    model: users,
                    as: 'owner',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: project_views,
                    attributes: ['user_id', 'view_name', 'view_description', 'assigned_tags', 'updatedAt']
                },
                {
                    model: project_releases
                }
            ]
        });

        if (project) {
            // Parse the JSON array of file names
            const files = project.project_file || []; // Assuming project_file is the column name
            const uploadsDir = 'C:/Users/Admin/Documents/GitHub/EBJV-Backend/uploads';

            // Attach file sizes to each file
            const filesWithSizes = files.map((fileName) => {
                const filePath = path.join(uploadsDir, fileName);
                try {
                    const stats = fs.statSync(filePath); // Synchronously fetch file stats
                    return {
                        fileName,
                        fileSize: stats.size, // File size in bytes
                    };
                } catch (err) {
                    console.error(`Error accessing file: ${fileName}`, err);
                    return {
                        fileName,
                        error: 'File not accessible',
                    };
                }
            });

            const ownerId = project.owner.id; // Owner's ID

            const projectViews = project.project_views.map((view) => {
                return {
                    view_name: view.view_name,
                    view_description: view.view_description,
                    assigned_tags: view.assigned_tags,
                    is_owner: view.user_id === ownerId, // Check if view.user_id matches owner.id
                };
            });

            // Send the response with files and project views
            res.status(200).json({
                ...project.toJSON(),
                files: filesWithSizes,
                project_views: projectViews, // Add processed project views
            });
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectActivity = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await projects.findByPk(id, {
            include: [
                {
                    model: users,
                    as: 'owner',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: project_activities
                }
            ],
        });

        if (project) {
            const ownerId = project.owner.id; // Owner's ID

            const projectActivities = project.project_activities.map((activity) => {
                return {
                    activityType: activity.activity_type,
                    activityDescription: activity.description,
                    relatedData: activity.related_data,
                    is_owner: activity.user_id === ownerId, // Check if view.user_id matches owner.id
                    lastModified: activity.updatedAt
                };
            });
            // Send the response with files and project views
            res.status(200).json({
                ...project.toJSON(),
                project_activities: projectActivities
            });
        } else {
            res.status(404).json({ error: 'Project Activity not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectTopics = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await projects.findByPk(id, {
            include: [
                {
                    model: users,
                    as: 'owner',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: project_topics
                }
            ]
        });

        if (project) {
            const ownerId = project.owner.id; // Owner's ID

            const projectTopics = project.project_topics.map((topic) => {
                return {
                    id: topic.id,
                    belongsTo: topic.project_id,
                    is_owner: topic.user_id === ownerId, // Check if view.user_id matches owner.id
                    topicName: topic.topic_name,
                    topicDescription: topic.topic_description,
                    assignee: topic.assignee,
                    topicType: topic.topic_type,
                    topicStatus: topic.topic_status,
                    topicPriority: topic.topic_priority,
                    topicDueDate: topic.topic_dueDate,
                    topicTags: topic.assigned_tags,
                    dateCreated: topic.createdAt,
                    lastUpdated: topic.updatedAt
                };
            });
            // Send the response with files and project views
            res.status(200).json({
                ...project.toJSON(),
                project_topics: projectTopics
            });
        } else {
            res.status(404).json({ error: 'Project Topic not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectToDos = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await projects.findByPk(id, {
            include: [
                {
                    model: users,
                    as: 'owner',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: project_toDos
                }
            ]
        });

        if (project) {
            const ownerId = project.owner.id; // Owner's ID

            const projectToDo = project.project_toDos.map((toDo) => {
                return {
                    id: toDo.id,
                    belongsTo: toDo.project_id,
                    is_owner: toDo.user_id === ownerId, // Check if view.user_id matches owner.id
                    toDoTitle: toDo.title,
                    toDoAssignee: toDo.assignee,
                    toDoDesc: toDo.description,
                    toDoStatus: toDo.status,
                    toDoPriority: toDo.priority,
                    toDoStatus: toDo.status,
                    toDoAttachments: toDo.attachments,
                    dateCreated: toDo.createdAt,
                    lastUpdated: toDo.updatedAt
                };
            });
            // Send the response with files and project views
            res.status(200).json({
                ...project.toJSON(),
                project_toDos: projectToDo
            });
        } else {
            res.status(404).json({ error: 'Project Topic not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProject = async (req, res) => {
    const { project_name, project_location } = req.body;
    const userId = req.user.id;
    const IFCFiles = req.files && req.files.length > 0 ? req.files.map(file => file.filename) : null;

    try {
        const newProject = await projects.create({
            project_name,
            project_location,
            user_id: userId,
            project_file: IFCFiles
        });

        if (newProject) {
            await project_activities.create({
                project_id: newProject.id,
                user_id: newProject.user_id,
                activity_type: 'Project Created',
                description: 'Created the project',
                related_data: newProject.project_file
              });
        }

        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProject = async (req,res) => {
    try{
        const { project_name, project_address, project_status, delete_files} = req.body;
        const project = await projects.findByPk(req.params.id);

        if (!project) {
            return res.status(400).json({message: 'project not found' })
        }

       if (project_name) project.project_name = project_name;
       if (project_address)  project.project_address = project_address;
       if (project_status) project.project_status = project_status;
       

       const currentFiles = project.project_file ? JSON.parse(project.project_file) : [];
        const newFiles = req.files ? req.files.map(file => file.filename) : [];
        let updatedFiles = [...new Set([...currentFiles, ...newFiles])]; // Deduplicate


       if (delete_files) {
        const filesToDelete = JSON.parse(delete_files);

        try {
            deleteFiles(filesToDelete); // Helper function defined below
            updatedFiles = updatedFiles.filter(file => !filesToDelete.includes(file));
        } catch (error) {
            console.error('Error deleting files:', error);
            return res.status(500).json({ message: 'Error deleting files', error: error.message });
        }
    }
        project.project_file = updatedFiles;
        if (project.project_file === "[]" || project.project_file === [] ){
            project.project_file = null;
        }

        await project.save();

        res.status(200).json({ message: 'Project edited successfully', data: project });
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

const deleteFiles = (files) => {
    files.forEach(file => {
        const filePath = path.join('C:/Users/Admin/Documents/GitHub/EBJV-Backend/uploads', file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
};


const deleteProject = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      // Find the project by ID before deletion
      const project = await projects.findByPk(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Parse the project media files
      const mediaFiles = project.project_file || [];
  
      // Delete the media files associated with the project
      if (mediaFiles.length > 0) {
        try {
          deleteFiles(mediaFiles); // Use your deleteFiles helper function
        } catch (error) {
          return res.status(500).json({ message: 'Error deleting files', error: error.message });
        }
      }
  
      // Now, delete the project from the database
      const deleted = await projects.destroy({ where: { id } });
      if (deleted) {
        res.status(200).json({ message: `Project deleted with ID: ${id}` });
      } else {
        res.status(404).json({ error: 'Failed to delete project' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  const getFiles = async (req, res) => {
    const filename = req.params.filename;

    const uploadsPath = path.join(
      'C:/Users/Admin/Documents/GitHub/EBJV-Backend/',
      'uploads'
    );
  
    const filePath = path.join(uploadsPath, filename);
  
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`Error serving file: ${err.message}`);
        res.status(404).send({ error: 'File not found' });
      }
    });
  };

  const getContributors = async (req, res) => {
    try {
      const { projectId } = req.params;
  
      // Fetch the project, including owner and collaborators
      const project = await projects.findByPk(projectId, {
        include: [
          {
            model: users,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'employer', 'status'],
            include: [
                {
                    model: roles,
                    attributes: ['role_name'],
                    through: { attributes: [] }, 
                }
            ]
          },
          {
            model: users,
            as: 'collaborators',
            through: { model: users_projects },
            attributes: ['id', 'first_name', 'last_name', 'employer', 'status'],
            include: [
                {
                    model: roles,
                    attributes: ['role_name'],
                    through: { attributes: [] }, 
                }
            ]
          },
        ],
      });
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      const collaborators = project.collaborators || [];
      const owner = project.owner ? [project.owner] : [];
  
      // Combine owner and collaborators into one array
      const allUsers = [...owner, ...collaborators];
  
      // Fetch last login for all users
      const userIds = allUsers.map((user) => user.id);
  
      const lastLogins = await staff_logs.findAll({
        where: {
          user_id: { [Op.in]: userIds },
          action: 'login',
        },
        attributes: ['user_id', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });
  
      // Map last login data for quick access
      const lastLoginMap = {};
      lastLogins.forEach((log) => {
        lastLoginMap[log.user_id] = log.createdAt;
      });
  
      // Adjust user statuses based on the last login date
      const contributors = allUsers.map((user) => {
        const lastLoginDate = lastLoginMap[user.id];
        const isInactive =
          !lastLoginDate || new Date() - new Date(lastLoginDate) > 7 * 24 * 60 * 60 * 1000;
        const roleNames = user.roles ? user.roles.map((role) => role.role_name) : [];
  
        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          employer: user.employer,
          role: roleNames, // Include all roles as an array
          status: isInactive ? 'Inactive' : user.status,
          last_login: lastLoginDate || 'No login record',
        };
      });
  
      res.status(200).json({
        project_name: project.project_name,
        owner: `${project.owner.first_name} ${project.owner.last_name}`,
        contributors,
      });
    } catch (error) {
      console.error('Error fetching contributors:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  const uploadFile = async (req,res) => {
    try{
        const userId = req.user.id;
        const project = await projects.findByPk(req.params.id);

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
          }

        const currentFiles = project.project_file || [];
        const newFiles = req.files ? req.files.map((file) => file.filename) : [];
        const updatedFiles = [...new Set([...currentFiles, ...newFiles])]; // Deduplicate

        project.project_file = updatedFiles.length > 0 ? updatedFiles : null;

        await project.save();

        if(newFiles.length > 0){
            await project_activities.create({
                project_id: project.id,
                user_id: userId,
                activity_type: 'File Uploaded',
                description: `Uploaded ${newFiles.length} file(s): `,
                related_data: `${newFiles.join(", ")}`
              });
        }
    res.status(200).json({message: "Upload successful"})
    } catch(error){
        console.error("File upload error:", error);
    res.status(500).json({error: "Upload Failed", details: error.message})
    }
  };

  const deleteFile = async (req, res) => {
    const projectId = req.params.projectId;
    const fileName = req.params.id; // Pass the file name as a param
    const userId = req.user.id; 
    try {
        const project = await projects.findByPk(projectId);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
    
        let projectFiles = project.project_file || [];
        if (typeof projectFiles === "string") {
          projectFiles = JSON.parse(projectFiles); 
        }
    
        const updatedFiles = projectFiles.filter((file) => file !== fileName);
    
        await project.update({ project_file: updatedFiles });
        
        deleteFiles([fileName]);

        await project_activities.create({
            project_id: project.id,
            user_id: userId,
            activity_type: "File Deleted",
            description: `Deleted file: `,
            related_data: `${fileName}`
          });
  
      res.status(200).json({ message: "File removed successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "File removal failed" });
    }
  };

const createRelease = async(req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const { releaseName, dueDate, recipients, releaseNote } = req.body;
    try{
        const project = await projects.findByPk(projectId);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
       const release =  await project_releases.create({
            project_id: project.id,
            user_id: userId,
            release_name: releaseName,
            due_date: dueDate, 
            recipients: recipients,
            release_note: releaseNote
        })

        if (release) {
            await project_activities.create({
                project_id: project.id,
                user_id: userId,
                activity_type: "Release Created",
                description: `Added Release: `,
                related_data: `${release.release_name}`
              });
        }

    
    res.status(200).json({message: 'Successfully created project release'});
    } catch (error){
    console.error("Error creating project release");
    res.status(500).json({error: error.message});
    }
};

const deleteRelease = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const id = req.params.id
    try{
        const project = await projects.findByPk(projectId);
        const release = await project_releases.findByPk(id);
      
        if (!release) {
            return res.status(404).json({ error: 'Release not found' });
        }

    const deletedRelease =  await project_releases.destroy({ where: { id } });
    await project_activities.create({
        project_id: project.id,
        user_id: userId,
        activity_type: "Release Deleted",
        description: `Deleted Release: `,
        related_data: `${release.release_name}`
      });
    if (deletedRelease){
        res.status(200).json({message: 'Release deleted successfully'})     
    } else {
        res.status(404).json({error: 'Failed to delete release '})   
    }
   
    } catch (error){
    res.status(500).json({error: "Error processing release to delete"})
    }
}

const createTopic = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const {topicName, topicDesc, topicType, assigneeList, topicStatus, topicPrio, topicDue} = req.body;
    try{
        const project = await projects.findByPk(projectId)
        if (!project){
            res.status(404).json({message: "Project not found"})
        }

        const topic = await project_topics.create({
            project_id: project.id,
            user_id: userId,
            topic_name: topicName,
            topic_description: topicDesc,
            assignee: assigneeList,
            topic_type: topicType,
            topic_status: topicStatus,
            topic_priority: topicPrio,
            topic_dueDate: topicDue
        })

        if (topic) {
            await project_activities.create({
                project_id: project.id,
                user_id: userId,
                activity_type: "Topic Created",
                description: `Created Topic: `,
                related_data: `${topicName}`
            })
        }
 
    res.status(200).json({message: 'Topic Created'});
    } catch (error) {
    console.error("Error creating");
    res.status(500).json({error: error.message});
    }
};

const deleteTopic = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const id = req.params.id
    try{
        const project = await projects.findByPk(projectId)
        if (!project){
            res.status(404).json({message: "Project not found"})
        }

        const topic = await project_topics.findByPk(id)
        if (!topic){
            res.status(404).json({message: 'Topic not found'});
        }

        const deletedTopic = await project_topics.destroy({ where: { id } });
        await project_activities.create({
            project_id: project.id,
            user_id: userId,
            activity_type: "Topic Deleted",
            description: `Deleted Release: `,
            related_data: `${topic.topic_name}`
          });

        if (deletedTopic){
            res.status(200).json({message: 'Release deleted successfully'})     
        } else {
            res.status(404).json({error: 'Failed to delete release '})   
        }
        } catch (error) {
        console.error("Error processing");
        res.status(500).json({error: error.message});
        }

};

const createToDo = async(req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const { todoTitle, todoDesc, todoAssignee, todoPriority, todoDueDate, todoType, todoAttachments } = req.body;
    try{
        const project = await projects.findByPk(projectId);
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
       const toDo =  await project_toDos.create({
            project_id: project.id,
            user_id: userId,
            title: todoTitle,
            assignee: todoAssignee, 
            description: todoDesc,
            priority: todoPriority,
            due_date: todoDueDate,
            type: todoType,
            attachments: todoAttachments || null
        })

        if (toDo) {
            await project_activities.create({
                project_id: project.id,
                user_id: userId,
                activity_type: "To Do Created",
                description: `Added To Do: `,
                related_data: `${toDo.title}`
              });
        }

    
    res.status(200).json({message: 'Successfully created project to do'});
    } catch (error){
    console.error("Error creating project to do");
    res.status(500).json({error: error.message});
    }
};

const updateToDo = async (req, res) => {
    try {

    res.status(200).json({message: 'Update to do success'})
    } catch (error){
    res.status(500).json({error: error.message})
    }
}

const deleteToDo = async (req, res) => {
    const projectId = req.params.projectId;
    const userId = req.user.id; 
    const id = req.params.id
    try{
        const project = await projects.findByPk(projectId);
        const todo = await project_toDos.findByPk(id);
      
        if (!todo) {
            return res.status(404).json({ error: 'Release not found' });
        }

    const deletedToDo =  await project_toDos.destroy({ where: { id } });
    await project_activities.create({
        project_id: project.id,
        user_id: userId,
        activity_type: "To Do Deleted",
        description: `Deleted To Do: `,
        related_data: `${todo.title}`
      });
    if (deletedToDo){
        res.status(200).json({message: 'To Do deleted successfully'})     
    } else {
        res.status(404).json({error: 'Failed to delete to do '})   
    }
   
    } catch (error){
    res.status(500).json({error: "Error processing to do to delete"})
    }
}

module.exports = {
    getAllprojects, getProjectById,
    createProject, updateProject, deleteProject,
    getProjectByLoggedInUser,
    getFiles,
    getProjectActivity, getProjectTopics,
    getContributors, getProjectToDos,
    uploadFile, deleteFile,
    createRelease, deleteRelease,
    createTopic, deleteTopic,
    createToDo, updateToDo, deleteToDo
    
};

