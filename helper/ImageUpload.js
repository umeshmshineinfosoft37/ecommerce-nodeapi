const multer = require('multer');
const path = require('path');

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public");
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `/Products/PRD${new Date().getTime()}.${ext}`);
    },

});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpg", "jpeg", "png", "webp") {
        cb(null, true);
    } else {
        cb(new Error("Not a jpg/jpeg/png File!!"), false);
    }
};
const ImageUpload = multer({ storage: multerStorage, fileFilter: multerFilter }).array('images', 10);

module.exports = { ImageUpload };


// module.exports = { profileUpload }