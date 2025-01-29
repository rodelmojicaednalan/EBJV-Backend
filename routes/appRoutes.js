const express = require('express');
const cors = require('cors');
const router = express.Router();
const userController = require('../controllers/userController');
const roleController = require('../controllers/roleController');
const {
  permission,
  can,
} = require('../middleware/permissionMiddleware');
const permissionController = require('../controllers/permissionController');
const userRoleController = require('../controllers/userRoleController');
const rolePermissionController = require('../controllers/rolePermissionController');
const projectController = require('../controllers/projectController');
const staffLogController = require('../controllers/staffLogController');

const {ifcUpload, imageUpload} = require('../utils/multerConfig');

// GET PROJECTS
router.get('/projects', projectController.getAllprojects);

router.get('/uploads/:filename', projectController.getFiles);
router.post('/request-access', projectController.requestAccess);
const authorize = require('../middleware/authorizationMiddleware');
router.use(authorize);
const permit = require('../middleware/permissionMiddleware');

// CRUD Routes for User
router.get('/users', userController.getUsers);
router.get('/user/:id', userController.getUserById);
router.get('/user', userController.getCurrentUser);
router.post('/addUser', userController.addUser);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/refresh', userController.refresh);
router.put('/update-user/:id', userController.updateUser);
router.delete('/delete-user/:id', userController.deleteUser);
router.put('/update-profile', userController.updateProfile);
router.post('/reset-password', userController.resetPassword);
router.post(
  '/confirm-reset-password',
  userController.confirmResetPassword
);

// CRUD Routes for Role
router.get('/roles', roleController.getRoles);
router.get('/role/:id', roleController.getRoleById);
router.post('/create-role', roleController.createRole);
router.put('/update-role/:id', roleController.updateRole);
router.delete('/delete-role/:id', roleController.deleteRole);

// CRUD Routes for Permissions
router.get('/permissions', permissionController.getPermissions);
router.get('/permission/:id', permissionController.getPermissionById);
router.post(
  '/create-permission',
  permissionController.createPermission
);
//router.put('/update-permission/:id', permissionController.updatePermission);
//router.delete('/delete-permission/:id', permissionController.deletePermission);

// CRUD Routes for Role Permissions
router.get(
  '/rolePermissions',
  rolePermissionController.getRolePermission
);
router.get(
  '/rolePermission/:id',
  rolePermissionController.getRolePermissionById
);
router.post(
  '/create-rolePermission',
  rolePermissionController.createRolePermission
);
router.put(
  '/update-rolePermission/:id',
  rolePermissionController.updateRolePermission
);
router.delete(
  '/delete-rolePermission/:id',
  rolePermissionController.deleteRolePermission
);

// CRUD Routes for User Roles
router.get('/userRoles', userRoleController.getUserRoles);
router.delete(
  '/delete-userRole/:id',
  userRoleController.deleteUserRole
);

// Staff Log Route
router.get('/staffLogs', staffLogController.getAllStaffLogs);
router.delete('/delete-log/:id', staffLogController.deleteStaffLog);
router.post('/mass-delete-logs/', staffLogController.massDeleteLogs);

// Project Routes

router.get('/my-projects',projectController.getProjectByLoggedInUser);
router.get('/project/:id', projectController.getProjectById);
router.post('/create-project', ifcUpload.array('project_file'), projectController.createProject);
router.put('/update-project/:id', imageUpload.single('projectThumbnail'), projectController.updateProject);
router.delete('/delete-project/:id', projectController.deleteProject);

router.get('/project-activities/:id', projectController.getProjectActivity);
router.get('/project-topics/:id', projectController.getProjectTopics);
router.get('/project-contributors/:projectId', projectController.getContributors);
router.get('/project-toDo/:id', projectController.getProjectToDos);

router.post('/upload-ifc-files/:id', ifcUpload.array('project_file', 10), projectController.uploadFile)
// router.post('/rename-file/:projectId', projectController.renameProjectFile);
router.post('/create-folder/:id', projectController.createFolder);
router.delete('/delete-file/:projectId/:id', projectController.deleteFile);

router.post('/create-release/:projectId', projectController.createRelease);
router.delete('/delete-release/:projectId/:id', projectController.deleteRelease);

router.post('/create-topic/:projectId', projectController.createTopic);
router.delete('/delete-topic/:projectId/:id', projectController.deleteTopic);

router.post('/create-todo/:projectId', projectController.createToDo);
router.post('/update-todo/:projectId/:id', projectController.updateToDo);
router.delete('/delete-todo/:projectId/:id', projectController.deleteToDo);

router.post('/create-group/:projectId', projectController.createGroup);
router.put('/rename-group/:projectId/:id', projectController.renameGroup);
router.delete('/delete-group/:projectId/:id', projectController.deleteGroup);
router.get('/group-contributors/:projectId/:groupId', projectController.getGroupContributors);
router.post('/invite-to-project/:projectId/', projectController.inviteToProject);
router.post('/invite-to-project/:projectId/:id', projectController.inviteToProject);
router.post('/group-invite/:projectId/:id', projectController.inviteToGroup);
router.delete('/remove-contributor/:projectId/:contId', projectController.removeContributor);
router.delete('/remove-groupMember/:projectId/:contId/:groupId', projectController.removeFromGroup)


router.get('/download-file/:projectId/:fileName', projectController.downloadFiles);



// // Upload route
// router.get(
//   '/uploads',
//   (req, res, next) => {
//     cors();
//     next();
//   },
//   async function (req, res) {
//     try {
//       const apiUrl = `/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/`;
//       const headers = {
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//       };
//       const apiResponse = await fetch(apiUrl, { headers });

//       if (!apiResponse.ok) {
//         throw new Error(`HTTP error! Status: ${apiResponse.status}`);
//       }

//       const data = await apiResponse.json();
//       res.status(200).send({ data });
//     } catch (error) {
//       console.error('Error:', error.message);
//       res.status(500).json({ error: 'Something went wrong.' });
//     }
//   }
// );

module.exports = router;
