import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads/'); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // File naming
  }
});
const upload = multer({storage: storage}); 
export default upload;