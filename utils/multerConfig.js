const multer = require('multer');
const path = require('path');

// Set ifc file storage for multer
const ifcStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb(null,  '/home/efabcoma/ebjv.api/uploads/ifc-files/');
    cb(null,  '/home/efabcoma/api-cadstream.ebjv/uploads/ifc-files/');
    // cb(null,  'C:/Users/Admin/Documents/GitHub/EBJV-Backend/uploads/ifc-files');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  }
});


// Set ifc file storage for multer
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  '/home/efabcoma/ebjv.api/uploads/project-thumbnails/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


// File filter for images/videos only
const ifcFilter = (req, file, cb) => {
  const allowedExtensions = /ifc|nc1|dxf|pdf|frag|json/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (extName) {
    return cb(null, true);
  } else {
    cb(new Error("Only IFC, NC1, DXF & PDF Files are allowed!"));
  }
};

const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (extName) {
    return cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"));
  }
};


// Set multer options
const ifcUpload = multer({
  storage: ifcStorage,
  fileFilter: ifcFilter,
  limits: { fileSize: 100000000 } // 100MB file size limit
});

const imageUpload = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5000000 } // 50MB file size limit
});

module.exports = {
  ifcUpload, imageUpload
};
