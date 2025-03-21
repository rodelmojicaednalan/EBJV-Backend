const {projects, project_subfolders, users, project_activities, project_views, 
  project_releases, project_topics, users_projects, staff_logs, roles,
  project_toDos, groups, users_groups} = require('../models');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { sendEmail } = require("../utils/emailService");
const hostedUploadPath = '/home/efabcoma/api-cadstream.ebjv/uploads/ifc-files'
// const localUploadPath = 'C:/Users/Admin/Documents/GitHub/EBJV-Backend/uploads/ifc-files'
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

const formatDateToInput = (date) => {
const d = new Date(date);
const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-based
const day = String(d.getDate() + 1).padStart(2, "0");
return `${year}-${month}-${day}`;
};  

// Helper Function to Fetch Folder Structure

const getFolderStructure = (folderPath, activities, batchSize = 100) => {
    let structure = {
        folderName: path.basename(folderPath),
        folderPath: folderPath,
        files: [],
        subfolders: []
    };

    try {
        const items = fs.readdirSync(folderPath); // Read folder contents

        let files = [];
        let folders = [];

        // Separate files and folders
        items.forEach((item) => {
            const itemPath = path.join(folderPath, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                folders.push(itemPath);
            } else {
                files.push({
                    fileName: item,
                    fileSize: stats.size,
                    fileCreationTime: stats.ctime,
                    fileLastModified: stats.mtime,
                    fileLastAccessed: stats.atime,
                    fileOwner: getFileOwner(item, activities),
                });
            }
        });

        // ✅ Process files in batches to avoid overload
        for (let i = 0; i < files.length; i += batchSize) {
            structure.files.push(...files.slice(i, i + batchSize));
        }

        // ✅ Process subfolders recursively
        folders.forEach((folder) => {
            structure.subfolders.push(getFolderStructure(folder, activities, batchSize));
        });

    } catch (err) {
        console.error(`Error reading folder: ${folderPath}`, err);
    }

    return structure;
};

// ✅ Helper function to get file owner from activities
const getFileOwner = (fileName, activities) => {
    const activity = activities.find((act) => act.related_data && act.related_data.includes(fileName));
    return activity && activity.activityUser
        ? `${activity.activityUser.first_name} ${activity.activityUser.last_name}`
        : 'Unknown';
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
              // {
              //     model: project_views,
              //     attributes: ['user_id', 'view_name', 'view_description', 'assigned_tags', 'updatedAt']
              // },
              // {
              //     model: project_releases
              // },
              {
                model: project_subfolders
              }
          ]
      });

      if (project) {
         const formattedStartDate = project.start_date ? formatDateToInput(project.start_date) : null;
         const formattedEndDate = project.end_date ? formatDateToInput(project.end_date) : null;

          // Parse the JSON array of file names
          // const files = project.project_file ? /*JSON.parse*/(project.project_file) : []; // Assuming project_file is the column name
          // const uploadsDir = '/home/efabcoma/ebjv.api/uploads/ifc-files';

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

          const projectFolderPath = path.join(hostedUploadPath, project.project_name); // Root project folder

          // Fetch complete folder structure with uploader information
          const folderTree = getFolderStructure(projectFolderPath, activities);
     

          // const ownerId = project.owner.id;

          // const projectViews = project.project_views.map((view) => ({
          //     view_name: view.view_name,
          //     view_description: view.view_description,
          //     assigned_tags: view.assigned_tags,
          //     is_owner: view.user_id === ownerId,
          // }));

          // const projectReleases = project.project_releases.map((release) => {
          //     const releaseActivity = activities.find(
          //         (act) =>
              
          //             act.related_data.includes(release.release_name)
          //     );

          //     const releaseOwner = releaseActivity
          //         ? `${releaseActivity.activityUser.first_name} ${releaseActivity.activityUser.last_name}`
          //         : 'Unknown';

          //     return {
          //         releaseId: release.id,
          //         release_name: release.release_name,
          //         total_files: release.total_files,
          //         due_date: release.due_date,
          //         recipients: release.recipients,
          //         release_status: release.release_status,
          //         release_note: release.release_note,
          //         assigned_tags: release.assigned_tags,
          //         createdAt: release.createdAt,
          //         is_owner: release.user_id === ownerId,
          //         release_owner: releaseOwner,
          //     };
          // });
          
        res.status(200).json({
            ...project.toJSON(),
            folderTree,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            // files: filesWithDetails,
            // project_views: projectViews,
            // project_releases: projectReleases
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

          const projectTopics = project.project_topics.map((topic) => {
              const topicActivity = activities.find((act) => {
                  let parsedData;
                  try {
                      parsedData = JSON.parse(act.related_data); // Parse the JSON string
                  } catch (error) {
                      console.error(`Failed to parse related_data: ${act.related_data}`, error);
                      return false;
                  }
                  return parsedData === topic.topic_name; // Compare the parsed value
              });


            const topicOwner = topicActivity
                ? `${topicActivity.activityUser.first_name} ${topicActivity.activityUser.last_name}`
                : 'Unknown';
                
              return {
                  id: topic.id,
                  belongsTo: topic.project_id,
                  is_owner: topic.user_id === ownerId, // Check if view.user_id matches owner.id
                  topicCreator: topicOwner,
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
                  toDoType: toDo.type,
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

const saveFilesRecursively = (basePath, uploadedFiles) => {
  let savedFiles = [];

  uploadedFiles.forEach((file) => {
    const filePath = path.join(basePath, file.originalname);
    const fileDir = path.dirname(filePath);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Move file to the correct directory
    fs.renameSync(file.path, filePath);

    // Store the relative path
    savedFiles.push(path.relative(hostedUploadPath, filePath));
  });

  return savedFiles;
};

const createProject = async (req, res) => {
  const { project_name, project_location } = req.body;
  const userId = req.user.id;

  try {
    // ✅ Create the main project folder
    const projectFolderPath = path.join(hostedUploadPath, project_name);
    if (!fs.existsSync(projectFolderPath)) {
      fs.mkdirSync(projectFolderPath, { recursive: true });
    }

    // ✅ Recursively save uploaded files
    const projectFiles = req.files['project_file']
      ? saveFilesRecursively(projectFolderPath, req.files['project_file'])
      : [];

    // ✅ Handle properties JSON file
    let properties = null;
    if (req.files['properties']?.[0]) {
      const propertiesFilePath = path.join(projectFolderPath, req.files['properties'][0].originalname);
      fs.renameSync(req.files['properties'][0].path, propertiesFilePath);

      const propertiesData = fs.readFileSync(propertiesFilePath, 'utf-8');
      properties = JSON.parse(propertiesData);
    }

    // ✅ Create project record in database
    const newProject = await projects.create({
      project_name,
      project_location,
      user_id: userId,
      project_file: projectFiles,
      properties
    });

    // ✅ Log project creation activity
    if (newProject) {
      await project_activities.create({
        project_id: newProject.id,
        user_id: userId,
        activity_type: 'Project Created',
        description: 'Created the project',
        related_data: projectFiles
      });
    }

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const renameProjectFolderRecursively = (oldPath, newPath) => {
  if (!fs.existsSync(oldPath)) return;

  // Ensure the new path does not already exist
  if (fs.existsSync(newPath)) {
    console.error("Folder with new name already exists:", newPath);
    return;
  }

  fs.renameSync(oldPath, newPath);
  console.log(`Folder renamed: ${oldPath} → ${newPath}`);
};

const updateProject = async (req, res) => {
const userId = req.user.id;
try {
  const { projectName, startDate, endDate, projectDescription } = req.body;
  const project = await projects.findByPk(req.params.id);

  if (!project) {
    return res.status(400).json({ message: "Project not found" });
  }

  // Store the changes for activity logging
  const changes = [];
  let projectFolderRenamed = false;
  let oldProjectFolderPath, newProjectFolderPath;

  if (projectName && projectName !== project.project_name) {
    changes.push(`Project Name: ${project.project_name} → ${projectName}`);
    oldProjectFolderPath = path.join(hostedUploadPath, project.project_name);
    newProjectFolderPath = path.join(hostedUploadPath, projectName);

    project.project_name = projectName;
    projectFolderRenamed = true;
  }

  const formattedStartDate = project.start_date ? formatDateToInput(project.start_date) : null;
  const formattedEndDate = project.end_date ? formatDateToInput(project.end_date) : null;

  if (startDate && startDate !== (formattedStartDate)) {
    changes.push(`Start Date: ${formattedStartDate} → ${startDate}`);
    project.start_date = startDate;
  }

  if (endDate && endDate !== formattedEndDate) {
    changes.push(`End Date: ${formattedEndDate} → ${endDate}`);
    project.end_date = endDate;
  }

  if (projectDescription && projectDescription !== project.project_description) {
    changes.push(`Description: ${project.project_description} → ${projectDescription}`);
    project.project_description = projectDescription;
  }

  // Handle thumbnail update
  if (req.file) {
    console.log(req.file);
    if (project.project_thumbnail) {
      deleteFiles([project.project_thumbnail]); // Ensure this function is implemented
    }
    changes.push(`Thumbnail updated: ${req.file.filename}`);
    project.project_thumbnail = req.file.filename; // Save new thumbnail filename
  }

   // Rename the project folder if the name has changed
   if (projectFolderRenamed) {
    renameProjectFolderRecursively(oldProjectFolderPath, newProjectFolderPath);
  }

  // Log the activity if there are any changes
  if (changes.length > 0) {
    await project_activities.create({
      project_id: project.id,
      user_id: userId,
      activity_type: "Project Updated",
      description: `Updated Project Details:`,
      related_data: changes.join("; "),
    });
  }

  await project.save();

  res.status(200).json({ message: "Project edited successfully", data: project });
} catch (error) {
  res.status(500).json({ message: "Error updating project", error: error.message });
}
};


const deleteFolderRecursively = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursively delete subdirectories
        deleteFolderRecursively(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    // Remove empty folder
    fs.rmdirSync(folderPath);
  }
};

const deleteProject = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // ✅ Find the project before deletion
    const project = await projects.findByPk(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // ✅ Parse project media files if any
    const mediaFiles = project.project_file ? JSON.parse(project.project_file) : [];

    // ✅ Determine project folder path
    const projectFolderPath = path.join(hostedUploadPath, project.project_name);

    // ✅ Delete all files and folders recursively
    if (fs.existsSync(projectFolderPath)) {
      try {
        deleteFolderRecursively(projectFolderPath);
      } catch (error) {
        return res.status(500).json({ message: 'Error deleting project folder', error: error.message });
      }
    }

    // ✅ Delete project record from database
    const deleted = await projects.destroy({ where: { id } });

    if (deleted) {
      res.status(200).json({ message: `Project deleted with ID: ${id}` });
    } else {
      res.status(404).json({ error: 'Failed to delete project' });
    }
  } catch (error) {
    console.error(`Error deleting project: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

const findFileRecursively = (folderPath, fileName) => {
  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isFile() && item === fileName) {
      return itemPath; // ✅ File found, return full path
    } else if (stat.isDirectory()) {
      const foundFilePath = findFileRecursively(itemPath, fileName);
      if (foundFilePath) return foundFilePath; // ✅ Stop searching once found
    }
  }
  return null; // ❌ File not found
};

const getFiles = async (req, res) => {
  const filename = decodeURIComponent(req.params.filename);  

  // ✅ Start searching in the main `uploads/ifc-files` directory
  const filePath = findFileRecursively(hostedUploadPath, filename);

  if (!filePath) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error serving file: ${err.message}`);
      res.status(500).send({ error: "Error serving file" });
    }
  });
};

const getAllProjectPDFs = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { folder } = req.query; // 📌 Extract folder from query (if any)

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const project = await projects.findByPk(projectId);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        let projectFolder = path.join(hostedUploadPath, project.project_name);
        if (folder) {
            projectFolder = path.join(hostedUploadPath, decodeURIComponent(folder)); // ✅ Decode user input
        }

        if (!fs.existsSync(projectFolder)) {
            return res.status(404).json({ error: "Folder not found" });
        }

        const getPDFFilesLevelByLevel = (directory) => {
            let filesAtThisLevel = [];
            let subfolders = [];

            const items = fs.readdirSync(directory, { withFileTypes: true });

            for (const item of items) {
                const itemPath = path.join(directory, item.name);

                if (item.isFile() && item.name.toLowerCase().endsWith(".pdf")) {
                    const relativePath = path.relative(hostedUploadPath, itemPath);
                    filesAtThisLevel.push(encodeURIComponent(relativePath)); // ✅ Encode file paths
                } else if (item.isDirectory()) {
                    subfolders.push(itemPath);
                }
            }

            let subfolderFiles = subfolders.map((subfolder) => ({
                folder: encodeURIComponent(path.relative(hostedUploadPath, subfolder)), // ✅ Encode folder paths
                files: getPDFFilesLevelByLevel(subfolder), // Recurse for subfolders
            }));

            return { currentLevelFiles: filesAtThisLevel, subfolderFiles };
        };

        const allPDFs = getPDFFilesLevelByLevel(projectFolder);

        if (allPDFs.currentLevelFiles.length === 0 && allPDFs.subfolderFiles.length === 0) {
            return res.status(404).json({ error: "No valid PDF files found" });
        }

        return res.status(200).json({ projectId, files: allPDFs });
    } catch (error) {
        console.error(`Error fetching project PDFs: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    }
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

const uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await projects.findByPk(req.params.id);
    const {folderName} = req.params;

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectFolderPath = path.join(hostedUploadPath, project.project_name);
    const targetFolder = folderName ? path.join(projectFolderPath, folderName) : projectFolderPath;

    // Ensure the target folder exists
    if (!fs.existsSync(targetFolder)) {
      return res.status(400).json({ error: "Target folder does not exist" });
    }

    const currentFiles = project.project_file ? JSON.parse(project.project_file) : [];
    const newFiles = req.files['project_file'] ? req.files['project_file'].map((file) => {
      const filePath = path.join(targetFolder, file.filename);
      fs.renameSync(file.path, filePath);
      return file.filename;
    }) : [];


    const updatedFiles = [...new Set([...currentFiles, ...newFiles])]; // Deduplicate

    project.project_file = updatedFiles.length > 0 ? (updatedFiles) : null;
    
    if (req.files['properties']?.[0]) {
      const propertiesFilePath = path.join(targetFolder, req.files['properties'][0].originalname);
      fs.renameSync(req.files['properties'][0].path, propertiesFilePath);

      const propertiesData = fs.readFileSync(propertiesFilePath, 'utf-8');
      project.properties = JSON.parse(propertiesData);
    }

    await project.save();

    if (newFiles.length > 0) {
      await project_activities.create({
        project_id: project.id,
        user_id: userId,
        activity_type: 'File Uploaded',
        description: `Uploaded ${newFiles.length} file(s):`,
        related_data: newFiles.join(", ")
      });
    }

    res.status(200).json({ message: "Upload successful" });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Upload Failed", details: error.message });
  }
};



const createFolder = async (req, res) => {
  const userId = req.user.id;
  try {
      const project = await projects.findByPk(req.params.id);
      if (!project) {
          return res.status(404).json({ error: "Project not found" });
      }

      const folderName = req.body.folder_name;
      if (!folderName) {
          return res.status(400).json({ error: "Folder name is required" });
      }

      const projectFolderPath = path.join(hostedUploadPath, project.project_name);
      const newFolderPath = path.join(projectFolderPath, folderName);

      // Ensure the project folder exists
      if (!fs.existsSync(projectFolderPath)) {
          fs.mkdirSync(projectFolderPath, { recursive: true });
      }

      // Create the subfolder if it doesn't exist
      if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath);
      } else {
          return res.status(400).json({ error: "Folder already exists" });
      }

      // Save folder info in database
      const createSubfolder = await project_subfolders.create({
          project_id: project.id,
          folder_name: folderName,
          folder_path: newFolderPath,
          created_by: userId
      });

      if (createSubfolder){
        await project_activities.create({
          project_id: project.id,
          user_id: userId,
          activity_type: "Folder Creation",
          description: `Created Project Sub-folder: `,
          related_data: `${folderName}`
        });
      }
      res.status(200).json({ message: "Folder created successfully" });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

const deleteFolders = async (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.id;
  try {
    const project = await projects.findByPk(projectId);
    if(!project){
      return res.status(404).json({error: "Project Not found"});
    }
    const user = await users.findByPk(userId);
    if (!user){
      return res.status(401).json({error: "User not found"});
    }

    const { folderPaths } = req.body; // Expecting an array of folder paths

    if (!folderPaths || !Array.isArray(folderPaths) || folderPaths.length === 0) {
      return res.status(400).json({ error: "Invalid folder paths provided" });
    }

    folderPaths.forEach((folderPath) => {
      const fullPath = path.join(hostedUploadPath, folderPath); // Adjust base folder
      deleteFolderRecursively(fullPath);
    });

    res.status(200).json({ message: "Folders deleted successfully" });
  } catch (error) {
    console.error("Error deleting folders:", error);
    res.status(500).json({ error: "Failed to delete folders", details: error.message });
  }
};

const renameFolder = async (req, res) => {
  const userId = req.user.id;
  const { projectId, oldFolderPath, newFolderName } = req.params;
  try {
    const project = await projects.findByPk(projectId);
    if(!project){
      return res.status(404).json({error: "Project Not found"});
    }
    const user = await users.findByPk(userId);
    if (!user){
      return res.status(401).json({error: "User not found"});
    }

    if (!oldFolderPath || !newFolderName) {
      return res.status(400).json({ error: "Missing folder path or new name" });
    }

    const oldFullPath = path.join(hostedUploadPath, decodeURIComponent(oldFolderPath)); // Ensure decoding
    const newFullPath = path.join(path.dirname(oldFullPath), decodeURIComponent(newFolderName));

    // Check if new folder name already exists
      if (fs.existsSync(newFullPath)) {
      return res.status(400).json({ error: "A folder with this name already exists" });
    }

    fs.renameSync(oldFullPath, newFullPath);

    res.status(200).json({ message: "Folder renamed successfully", newPath: newFullPath });
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ error: "Failed to rename folder", details: error.message });
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

    deleteFiles([fileName], path.join(hostedUploadPath, project.project_name)); // ✅ Now searches recursively

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
    res.status(500).json({ error: error.message });
  }
};


const deleteFiles = (files, currentPath = hostedUploadPath) => {
  files.forEach((fileName) => {
    const searchAndDelete = (folderPath) => {
      const items = fs.readdirSync(folderPath);

      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && item === fileName) {
          fs.unlinkSync(itemPath); // ✅ Delete file
          console.log(`Deleted: ${itemPath}`);
          return true;
        } else if (stat.isDirectory()) {
          if (searchAndDelete(itemPath)) {
            return true;
          }
        }
      }
      return false;
    };

    console.log(`Searching for ${fileName}...`);
    const found = searchAndDelete(currentPath);

    if (!found) {
      console.warn(`File ${fileName} not found in ${currentPath}`);
    }
  });
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
// send email to invited contributors
for (const contributor of contributorsToAdd) {
  const { first_name: firstName, last_name: lastName, email } = contributor;

  await sendEmail(
    email, // Recipient email
    'Welcome to the EBJV Project Team!', // Subject
    `
    Dear ${firstName},
    We’re excited to welcome you as a member of the EBJV project: ${project.project_name}. 

    Your involvement is key to its success. You can now access the project and collaborate with the team. 
    `, // Plain-text version of the email
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EBJV Account Request</title>
  <style>
      /* Reset styles */
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      /* Base styles */
      body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
      }

      /* Container styles */
      .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          margin: 20px auto;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Header styles */
      .header {
          background-color: #eb6314;
          padding: 24px;
          text-align: center;
          color: #1e293b;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
      }

      /* Content styles */
      .content {
          padding: 32px 24px;
          text-align: left;
      }

      .title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 24px;
          line-height: 1.4;
      }

      .detail-row {
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
      }

      .detail-label {
          font-weight: 600;
          color: #475569;
          margin-right: 8px;
      }

      .detail-value {
          color: #1e293b;
      }

      /* Button styles */
      .button {
          display: inline-block;
          background-color: #eb6314;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 24px;
          text-align: center;
          transition: background-color 0.2s;
      }

      .button:hover {
          background-color:rgb(243, 105, 25);
      }

      /* Footer styles */
      .footer {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-size: 12px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
      }

      /* Responsive styles */
      @media only screen and (max-width: 600px) {
          .container {
              margin: 10px;
              width: auto;
          }

          .content {
              padding: 24px 16px;
          }

          .button {
              display: block;
              width: 100%;
          }
      }
  </style>
</head>
<body>
  <div class="container">
      <div class="header">
          EBJV PROJECT INVITE
      </div>

      <div class="content">
          <h1 class="title"> Dear ${firstName}, <br> <br>
We’re excited to welcome you as a member of the EBJV project: ${project.project_name}. Your involvement is key to its success.
<br> <br>
You can now access the project and collaborate with the team.
<br> <br>
Click the button below to get started:</h1>

          <a href="https://cadstream.ebjv.e-fab.com.au/" class="button">
              Head to the App 
          </a>
      </div>
      <div class="footer">
        If you have any questions, feel free to reach out to us at chris.pieri@ebjv.com.au.
        <br>
        <br>
          EBJV<br>
          Australia
      </div>
  </div>
</body>
</html>
    `
  );
}

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

const removeContributor = async(req, res ) => {
const { projectId, contId } = req.params;
const userId = req.user.id; 
try{
  const projectContributor = await users_projects.findOne({where: { user_id: contId, project_id: projectId}})
  if(!projectContributor){
    return res.status(404).json({ message: 'Contributor not found in the project'})
  }
  await projectContributor.destroy();

  await project_activities.create({
    project_id: projectId,
    user_id: userId,
    activity_type: "Remove Contributor",
    description: `Removed a user from project`,
  });
  
res.status(200).json({message: 'Contributor removed successfully'})
} catch (error){
res.status(500).json({ error: error.message})
}
}

const removeFromGroup = async(req, res ) => {
const { projectId, contId, groupId } = req.params;
const userId = req.user.id; 
try{
  const projectGroup = await groups.findOne({where: {id: groupId, project_id: projectId}})
  if(!projectGroup){
    return res.status(404).json({ message: 'Group not found in the project'})
  }
  const groupContributor = await users_groups.findOne({where: { user_id: contId, group_id: groupId}})
  if(!groupContributor){
    return res.status(404).json({ message: 'Contributor not found in the group'})
  }
  await groupContributor.destroy();

  await project_activities.create({
    project_id: projectId,
    user_id: userId,
    activity_type: "Remove from Group",
    description: `Removed user from the group`
  });
res.status(200).json({message: 'Contributor removed successfully'})
} catch (error){
res.status(500).json({ error: error.message})
}
}

const downloadFiles = async (req, res) => {
  const { projectId, fileName } = req.params;
  const userId = req.user.id;

  try {
    const project = await projects.findByPk(projectId);
    if (!project) return res.status(404).json({ message: "Project Not Found" });

    if (!fileName) return res.status(400).json({ message: "File Name is required" });

    // First, check in the main directory
    let filePath = path.join(hostedUploadPath, fileName);

    // If file doesn't exist, search recursively
    if (!fs.existsSync(filePath)) {
      console.log(`File not found in main directory. Searching recursively...`);
      filePath = findFileRecursively(hostedUploadPath, fileName);
    }

    // If still not found, return 404
    if (!filePath) {
      return res.status(404).json({ message: "File Not Found" });
    }

    // Stream the file for download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return res.status(500).json({ message: "Error downloading file", error: err.message });
      }
      console.log(`✅ File "${fileName}" downloaded successfully.`);
    });

    // Log the download activity
    await project_activities.create({
      project_id: project.id,
      user_id: userId,
      activity_type: "File Download",
      description: `Downloaded file: ${fileName}`,
      related_data: fileName,
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: error.message });
  }
};


const requestAccess = async (req,res) => {
const { firstName, lastName, email, project, contact, reason } = req.body;
const adminEmail = 'chris.pieri@ebjv.com.au'
try{
  await sendEmail(
    adminEmail, 
    'EBJV App Account Request',
     `
     A New Account Request has been made, their details are:
     Name: ${firstName} ${lastName},
     Email: ${email},
     Project: ${project},
     Contact: ${contact},
     Reason: ${reason},
     Please review and approve or reject this request.
     `,
    `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EBJV Account Request</title>
  <style>
      /* Reset styles */
      * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
      }

      /* Base styles */
      body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
      }

      /* Container styles */
      .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          margin: 20px auto;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Header styles */
      .header {
          background-color: #eb6314;
          padding: 24px;
          text-align: center;
          color: #1e293b;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
      }

      /* Content styles */
      .content {
          padding: 32px 24px;
      }

      .title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 24px;
          line-height: 1.4;
      }

      .detail-row {
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
      }

      .detail-label {
          font-weight: 600;
          color: #475569;
          margin-right: 8px;
      }

      .detail-value {
          color: #1e293b;
      }

      /* Button styles */
      .button {
          display: inline-block;
          background-color: #eb6314;
          color: #ffffff;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 24px;
          text-align: center;
          transition: background-color 0.2s;
      }

      .button:hover {
          background-color:rgb(243, 105, 25);
      }

      /* Footer styles */
      .footer {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-size: 12px;
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
      }

      /* Responsive styles */
      @media only screen and (max-width: 600px) {
          .container {
              margin: 10px;
              width: auto;
          }

          .content {
              padding: 24px 16px;
          }

          .button {
              display: block;
              width: 100%;
          }
      }
  </style>
</head>
<body>
  <div class="container">
      <div class="header">
          EBJV APP ACCOUNT REQUEST
      </div>

      <div class="content">
          <h1 class="title">A New Account Request has been made, their details are:</h1>
          
          <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${firstName} ${lastName}</span>
          </div>
          
          <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">${email}</span>
          </div>
          
          <div class="detail-row">
              <span class="detail-label">Project:</span>
              <span class="detail-value">${project}</span>
          </div>
          
          <div class="detail-row">
              <span class="detail-label">Contact:</span>
              <span class="detail-value">${contact}</span>
          </div>
          
          <div class="detail-row">
              <span class="detail-label">Reason:</span>
              <span class="detail-value">${reason}</span>
          </div>

          <p style="margin: 24px 0; color: #475569;">
              Please review and approve or reject this request.<br>
              Approved? Head to the app to create an account.
          </p>

          <a href="https://cadstream.ebjv.e-fab.com.au/" class="button">
              Head to the App
          </a>
      </div>

      <div class="footer">
          EBJV<br>
          Australia
      </div>
  </div>
</body>
</html>
    `
  )
  res.status(200).json({message: 'Request Email Sent Successfully'});
} catch (error){
  res.status(500).json({error: error.message})
}
};


const updateTopic = async (req, res) => {
  const { projectId, id } = req.params;
  const userId = req.user.id; 
  const {topicName, topicDesc, topicType, assigneeList, topicStatus, topicPrio, topicDue} = req.body;
  try{
      const project = await projects.findByPk(projectId)
      if (!project){
          res.status(404).json({message: "Project not found"})
      }
      const topic = await project_topics.findByPk(id)
      if (!topic){
          res.status(404).json({message: 'Topic not found'});
      }
      
      await topic.update({
        topic_name: topicName,
        topic_description: topicDesc,
        assignee: assigneeList,
        topic_type: topicType,
        topic_status: topicStatus,
        topic_priority: topicPrio,
        topic_dueDate: topicDue
      })
      
      await project_activities.create({
        project_id: project.id,
        user_id: userId,
        activity_type: "Topic Updated",
        description: `Updated Topic: `,
        related_data: `${topic.topic_name}`
      })
      
  res.status(200).json({message: 'Topic updated'});
} catch (error){
  console.error("Error finding project");
  res.status(500).json({error: error.message});
}
}


module.exports = {
getAllprojects, getProjectById,
createProject, updateProject, deleteProject,
getProjectByLoggedInUser,
getFiles, getAllProjectPDFs,
getProjectActivity, getProjectTopics,
getContributors, getProjectToDos,
uploadFile, createFolder, deleteFolders, renameFolder, deleteFile,
createRelease, deleteRelease,
createTopic, deleteTopic,
createToDo, updateToDo, deleteToDo,
createGroup, deleteGroup, renameGroup, 
getGroupContributors, inviteToProject, inviteToGroup, removeContributor, removeFromGroup,
downloadFiles, requestAccess,
getFolderStructure

};

