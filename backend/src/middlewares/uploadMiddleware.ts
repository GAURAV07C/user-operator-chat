import multer from "multer";
import path from "path";

// Storage engine
const storage = multer.diskStorage({
  destination: "./uploads/", // Specify folder for storing uploads
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb("Only image files are allowed!", false);
  }
};

// Create upload middleware with storage and file filter
export const upload = multer({ storage, fileFilter });
