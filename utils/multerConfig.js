const multer = require('multer');
const path = require('path');

// Set storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  '/home/olongapobataanza/ebjv-api.olongapobataanzambalesads.com/uploads/ifc-files/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter for images/videos only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|mp4|avi|mkv|webp|pdf|ifc/;

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());


  if (extName) {
    return cb(null, true);
  } else {
    cb(new Error("Only images, videos, IFC Files, and PDFs are allowed!"));
  }
};


// Set multer options
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50000000 } // 50MB file size limit
});

module.exports = upload;
