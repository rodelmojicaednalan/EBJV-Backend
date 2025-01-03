const {projects, users, project_activities, project_views, 
  project_releases, project_topics, users_projects, staff_logs, roles,
  project_toDos, groups, users_groups} = require('../models');
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
try {
  const userId = req.user.id;

  const currentProjects = await projects.findAll({
    where: {
      [Op.or]: [
        { user_id: userId }, // Projects owned by the user
        { '$collaborators.id$': userId }, // Projects where the user is a collaborator
      ],
    },
    include: [
      {
        model: users,
        as: 'collaborators', // Alias defined in projects model
        attributes: ['id', 'first_name', 'last_name'], // Customize attributes as needed
        through: { attributes: [] }, // Exclude join table details if not needed
      },
      {
        model: users,
        as: 'owner',
        attributes: ['first_name', 'last_name'], // Attributes to fetch for the owner
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  res.status(200).json({ data: currentProjects });
} catch (error) {
  console.error('Error fetching projects:', error);
  res.status(500).json({ message: 'Error fetching projects', error: error.message });
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
          const files = project.project_file ? JSON.parse(project.project_file) : []; // Assuming project_file is the column name
          const uploadsDir = '/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/uploads/ifc-files';

          // Fetch project activities for this project
          const activities = await project_activities.findAll({
              where: { project_id: id },
              attributes: ['user_id', 'related_data'], // Include only the necessary fields
              include: [
                  {
                      model: users,
                      as: 'activityUser', // Assuming there's an association to fetch user info
                      attributes: ['id', 'first_name', 'last_name']
                  }
              ]
          });

          // Attach file sizes and owners to each file
          const filesWithDetails = files.map((fileName) => {
              const filePath = path.join(uploadsDir, fileName);
              let fileSize, fileOwner;

              // Get file size
              try {
                  const stats = fs.statSync(filePath);
                  fileSize = stats.size;
              } catch (err) {
                  console.error(`Error accessing file: ${fileName}`, err);
                  fileSize = 'File not accessible';
              }

              // Find the owner by checking related_data in activities
              const activity = activities.find((act) =>
                  act.related_data.includes(fileName)
              );

              if (activity && activity.activityUser) {
                  fileOwner = `${activity.activityUser.first_name} ${activity.activityUser.last_name}`;
              } else {
                  fileOwner = 'Unknown';
              }

              return {
                  fileName,
                  fileSize,
                  fileOwner
              };
          });

          const ownerId = project.owner.id;

          const projectViews = project.project_views.map((view) => ({
              view_name: view.view_name,
              view_description: view.view_description,
              assigned_tags: view.assigned_tags,
              is_owner: view.user_id === ownerId,
          }));

          const projectReleases = project.project_releases.map((release) => {
              const releaseActivity = activities.find(
                  (act) =>
              
                      act.related_data.includes(release.release_name)
              );

              const releaseOwner = releaseActivity
                  ? `${releaseActivity.activityUser.first_name} ${releaseActivity.activityUser.last_name}`
                  : 'Unknown';

              return {
                  release_name: release.release_name,
                  total_files: release.total_files,
                  due_date: release.due_date,
                  recipients: release.recipients,
                  release_status: release.release_status,
                  release_note: release.release_note,
                  assigned_tags: release.assigned_tags,
                  createdAt: release.createdAt,
                  is_owner: release.user_id === ownerId,
                  release_owner: releaseOwner,
              };
          });
          
        res.status(200).json({
            ...project.toJSON(),
            files: filesWithDetails,
            project_views: projectViews,
            project_releases: projectReleases
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
                  model: project_activities,
                  include: [
                      {
                          model: users, // Include users for each activity
                          as: 'activityUser', // Alias for the activity user
                          attributes: ['first_name', 'last_name'] // Only retrieve first and last name
                      }
                  ]
              }
          ],
      });

      if (project) {
          const ownerId = project.owner.id; // Owner's ID

          const projectActivities = project.project_activities.map((activity) => {
              return {
                  activityId: activity.id,
                  activityType: activity.activity_type,
                  activityDescription: activity.description,
                  relatedData: activity.related_data,
                  is_owner: activity.user_id === ownerId, // Check if activity.user_id matches owner.id
                  lastModified: activity.updatedAt,
                  activator: activity.activityUser ? `${activity.activityUser.first_name} ${activity.activityUser.last_name}` : 'Unknown' // Add user's name for the activity
              };
          });

          // Send the response with activities and project details
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
  const userId = req.user.id;
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
          
          const activities = await project_activities.findAll({
            where: { project_id: project.id },
            attributes: ['user_id', 'related_data'], // Include only the necessary fields
            include: [
                {
                    model: users,
                    as: 'activityUser', // Assuming there's an association to fetch user info
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });
        
          const ownerId = project.owner.id; // Owner's ID

          const projectToDo = project.project_toDos.map((toDo) => {
            const todoActivity = activities.find((act) => {
                  let parsedData;
                  try {
                      parsedData = JSON.parse(act.related_data); // Parse the JSON string
                  } catch (error) {
                      console.error(`Failed to parse related_data: ${act.related_data}`, error);
                      return false;
                  }
                  return parsedData === toDo.title; // Compare the parsed value
              });


            const todoOwner = todoActivity
                ? `${todoActivity.activityUser.first_name} ${todoActivity.activityUser.last_name}`
                : 'Unknown';
              
              return {
                  id: toDo.id,
                  belongsTo: toDo.project_id,
                  is_owner: toDo.user_id === userId, // Check if view.user_id matches owner.id
                  owner: todoOwner,
                  toDoTitle: toDo.title,
                  toDoAssignee: toDo.assignee,
                  toDoDesc: toDo.description,
                  toDoStatus: toDo.status,
                  toDoPriority: toDo.priority,
                  toDoStatus: toDo.status,
                  toDoAttachments: toDo.attachments,
                  dateCreated: toDo.createdAt,
                  lastUpdated: toDo.updatedAt,
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
      const filePath = path.join('/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/uploads/ifc-files', file);
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
    const mediaFiles = project.project_file ? JSON.parse(project.project_file) : []; 

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
    '/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/',
    'uploads/ifc-files'
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
          attributes: ['id', 'first_name', 'last_name', 'email', 'employer', 'status'],
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
          attributes: ['id', 'first_name', 'last_name', 'email', 'employer', 'status'],
          include: [
              {
                  model: roles,
                  attributes: ['role_name'],
                  through: { attributes: [] }, 
              }
          ]
        },
        {
          model: groups,
          attributes: ['id', 'group_name'],
          include: [
            {
              model: users,
              attributes: ['id', 'first_name', 'last_name', 'email', 'employer', 'status'],
              through: { model: users_groups, attributes: [] }, // Only fetch user-group relationship
            },
          ],
        },
      ],
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const collaborators = project.collaborators || [];
    const owner = project.owner ? [project.owner] : [];
    const projectGroups = project.groups || [];

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
      order: [['createdAt', 'ASC']],
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
        email: user.email,
        role: roleNames, // Include all roles as an array
        status: isInactive ? 'Inactive' : user.status,
        last_login: lastLoginDate || 'No login record',
      };
    });

    const formattedGroups = projectGroups.map((group) => ({
      id: group.id,
      group_name: group.group_name,
      members: group.users.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
      })),
    }));

    res.status(200).json({
      project_name: project.project_name,
      owner: `${project.owner.first_name} ${project.owner.last_name}`,
      contributors,
      groups: formattedGroups
    });
    
  } catch (error) {
    console.error('Error fetching contributors:', error);
    res.status(500).json({ error: error.message });
  }
};

const uploadFile = async (req,res) => {
  try{
      const userId = req.user.id;
      const project = await projects.findByPk(req.params.id);

      if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

      const currentFiles = project.project_file ? JSON.parse(project.project_file) : []; 
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
  
      let projectFiles = project.project_file ? JSON.parse(project.project_file) : []; 
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

const createGroup = async(req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id; 
  const { groupName  } = req.body;
  try{
      const project = await projects.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
     const group =  await groups.create({
          project_id: project.id,
          group_name: groupName
      })

      if (group) {
          await project_activities.create({
              project_id: project.id,
              user_id: userId,
              activity_type: "Created Group",
              description: `Created Group: `,
              related_data: `${groupName}`
            });
      }

  
  res.status(200).json({message: 'Successfully created group'});
  } catch (error){
  console.error("Error creating group");
  res.status(500).json({error: error.message});
  }
};

const deleteGroup = async (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id; 
  const id = req.params.id
  try{
      const project = await projects.findByPk(projectId);
      const group = await groups.findByPk(id);
    
      if (!group) {
          return res.status(404).json({ error: 'Group not found' });
      }

  const deletedGroup =  await groups.destroy({ where: { id } });
  await project_activities.create({
      project_id: project.id,
      user_id: userId,
      activity_type: "Group Deleted",
      description: `Deleted Group: `,
      related_data: `${group.group_name}`
    });
  if (deletedGroup){
      res.status(200).json({message: 'Group deleted successfully'})     
  } else {
      res.status(404).json({error: 'Failed to delete group '})   
  }
 
  } catch (error){
  res.status(500).json({error: "Error processing group to delete"})
  }
};

const renameGroup = async (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id; 
  const id = req.params.id
  const { groupName  } = req.body;
  try {
      const project = await projects.findByPk(projectId);
      const group = await groups.findByPk(id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      if (!group) {
          return res.status(404).json({ error: 'Group not found' });
      }

    const [updated] = await groups.update({ groupName  }, { where: { id } });

    await project_activities.create({
      project_id: project.id,
      user_id: userId,
      activity_type: "Group Renamed",
      description: `Renamed group to: `,
      related_data: `${groupName}`
    });
    if (updated) {
      const renamedGroup = await groups.findByPk(id);
      res.status(200).json(renamedGroup);
    } else {
      res.status(404).json({ error: 'Role not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroupContributors = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Fetch the group, including associated users
    const group = await groups.findByPk(groupId, {
      include: [
        {
          model: users,
          attributes: ['id', 'first_name', 'last_name', 'email', 'employer', 'status'],
          include: [
            {
              model: roles,
              attributes: ['role_name'],
              through: { attributes: [] }, // Exclude join table details
            },
          ],
          through: { model: users_groups }, // Exclude join table details if not needed
        },
      ],
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Extract contributors (users)
    const contributors = group.users || [];

    // Fetch last login for all contributors
    const userIds = contributors.map((user) => user.id);

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
    const groupContributors = contributors.map((user) => {
      const lastLoginDate = lastLoginMap[user.id];
      const isInactive =
        !lastLoginDate || new Date() - new Date(lastLoginDate) > 7 * 24 * 60 * 60 * 1000;
      const roleNames = user.roles ? user.roles.map((role) => role.role_name) : [];

      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        employer: user.employer,
        email: user.email,
        role: roleNames, // Include all roles as an array
        status: isInactive ? 'Inactive' : user.status,
        last_login: lastLoginDate || 'No login record',
      };
    });

    res.status(200).json({
      group_name: group.group_name,
      contributors: groupContributors,
    });
  } catch (error) {
    console.error('Error fetching group contributors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const inviteToProject = async (req, res) => {
const { projectId } = req.params;
const userId = req.user.id; 
const { emails, groupId } = req.body;

try {
  const project = await projects.findByPk(projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Check if the group exists if groupId is provided
  let group = null;
  if (groupId) {
    group = await groups.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
  }

  // Add contributors to the project (users_projects table)
  const contributorsToAdd = await users.findAll({
    where: { email: emails },
  });

  if (contributorsToAdd.length === 0) {
    return res.status(404).json({ error: "No users found with the provided emails" });
  }

  // Insert into users_projects (to link users to the project)
  await users_projects.bulkCreate(
    contributorsToAdd.map((user) => ({
      user_id: user.id,
      project_id: projectId,
    }))
  );
  await project_activities.create({
    project_id: project.id,
    user_id: userId,
    activity_type: "Add People To Project",
    description: `Added user(s) to project: `,
    related_data: `${emails}`
  });

  // If groupId is provided, add users to the group (users_groups table)
  if (groupId) {
    // Retrieve the current members of the group using the join table (users_groups)
    const groupMembers = await users_groups.findAll({
      where: { group_id: groupId },
      attributes: ['user_id'],
    });

    // Extract the user IDs of the current group members
    const groupMemberIds = groupMembers.map((member) => member.user_id);

    // Filter out users who are already part of the group
    const usersGroupsToAdd = contributorsToAdd.filter((user) => !groupMemberIds.includes(user.id));

    // Bulk add to users_groups (only if the user is not already a member)
    if (usersGroupsToAdd.length > 0) {
      await users_groups.bulkCreate(
        usersGroupsToAdd.map((user) => ({
          user_id: user.id,
          group_id: groupId,
        }))
      );
        await project_activities.create({
            project_id: project.id,
            user_id: userId,
            activity_type: "Add People To Group",
            description: `Added user(s) to group: `,
            related_data: `${emails}`
          });
    }
  }

  res.status(200).json({ message: "Contributors invited successfully" });
} catch (error) {
  console.error("Error inviting to project:", error);
  res.status(500).json({ error: error.message });
}
};

const inviteToGroup = async (req, res) => {
const { projectId, id } = req.params;
const userId = req.user.id; 
const { emails } = req.body;

try {
  const project = await projects.findByPk(projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  let group = null;
  if (id) {
    group = await groups.findByPk(id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
  }

  const contributorsToAdd = await users.findAll({
    where: { email: emails },
  });

  // If groupId is provided, add users to the group (users_groups table)
  if (id) {
    // Retrieve the current members of the group using the join table (users_groups)
    const groupMembers = await users_groups.findAll({
      where: { group_id: id },
      attributes: ['user_id'],
    });

    // Extract the user IDs of the current group members
    const groupMemberIds = groupMembers.map((member) => member.user_id);

    // Filter out users who are already part of the group
    const usersGroupsToAdd = contributorsToAdd.filter((user) => !groupMemberIds.includes(user.id));

    // Bulk add to users_groups (only if the user is not already a member)
    if (usersGroupsToAdd.length > 0) {
      await users_groups.bulkCreate(
        usersGroupsToAdd.map((user) => ({
          user_id: user.id,
          group_id: id,
        }))
      );
      await project_activities.create({
        project_id: project.id,
        user_id: userId,
        activity_type: "Add People To Group",
        description: `Added user(s) to group(${group.group_name}): `,
        related_data: `${emails}`
      });
    }
  }

  res.status(200).json({ message: "Contributors added to group successfully" });
} catch (error) {
  console.error("Error inviting to project:", error);
  res.status(500).json({ error: error.message });
}
};

const downloadFiles = async (req, res) => {
const { projectId, fileName } = req.params;
const userId = req.user.id; 
const directory = path.join(
  '/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/',
  'uploads/ifc-files'
);

try {
  // Construct the full file path
  const filePath = path.join(directory, fileName);
  const project = await projects.findByPk(projectId);

  // Validate if project exists
  if (!project) {
    return res.status(404).json({ message: 'Project Not Found' });
  }

  // Validate if file name is provided
  if (!fileName) {
    return res.status(400).json({ message: 'File Name is required' });
  }

  // Check if the file exists in the directory
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File Not Found' });
  }

  // Stream the file to the client for download
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ message: "Error downloading file", error: err.message });
    } else {
      console.log(`File "${fileName}" downloaded successfully.`);
    }
  });
  await project_activities.create({
    project_id: project.id,
    user_id: userId,
    activity_type: "File Download",
    description: `Downloaded file: `,
    related_data: `${fileName}`
  });
} catch (error) {
  console.error("Error downloading file:", error);
  res.status(500).json({ error: error.message });
}
};



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
createToDo, updateToDo, deleteToDo,
createGroup, deleteGroup, renameGroup, 
getGroupContributors, inviteToProject, inviteToGroup,
downloadFiles

};

