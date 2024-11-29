const {projects, users} = require('../models');

const getAllprojects = async (req, res) => {
    try {
        const allprojects = await projects.findAll();
        res.status(200).json(allprojects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProjectByLoggedInUser = async (req, res) => {
    try{
        const userId = req.user.id;
        const currentProjects = await projects.findAll({
            where: {userId},
            order: [['createdAt', 'DESC']],
            include: [
                {
                model: users,
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
        const project = await projects.findByPk(id);
        if (project) {
            res.status(200).json(project);
        } else {
            res.status(404).json({ error: 'Project  not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProject = async (req, res) => {
    const { project_name, project_address, project_status } = req.body;
    const userId = req.user.id;
    const IFCFiles = req.files && req.files.length > 0 ? req.files.map(file => file.filename) : null;

    try {
        const newProject = await projects.create({
            project_name,
            project_address,
            project_status,
            user_id: userId,
            project_file: IFCFiles
        });

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
        const filePath = path.join('/home/anthonyweb/ebjv-api.imseoninja.com/uploads/', file);
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
        return res.status(404).json({ error: 'project not found' });
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
        res.status(200).json({ message: `project deleted with ID: ${id}` });
      } else {
        res.status(404).json({ error: 'project not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  


module.exports = {
    getAllprojects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectByLoggedInUser
    
};

