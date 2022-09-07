const multer = require('multer')
const path = require('path')
    // SET Storage
    // let storage = multer.diskStorage({
    //     destination: function(req, file, cb) {
    //         cb(null, "public");
    //     },
    //     filename: function(req, file, cb) {
    //         const fileName = file.originalname.replace(" ", "-");
    //         cb(null, fileName + "-" + Date.now());
    //     },
    // });
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public");
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split("/")[1];
        cb(null, `/Profiles/PRF${new Date().getTime()}.${ext}`);
    },

});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.split("/")[1] === "jpg", "jpeg", "png", "webp") {
        cb(null, true);
    } else {
        cb(new Error("Not a jpg/jpeg/png File!!"), false);
    }
};
// const profileUpload = multer({
//         storage,
//         // limits: {
//         //     fileSize: 1000000 // 1000000 Bytes = 1 MB
//         // },
//         fileFilter(req, file, cb) {
//             if (!file.originalname.match(/\.(png|jpg)$/)) {
//                 // upload only png and jpg format
//                 return cb(new Error('Please upload a Image'))
//             }
//             cb(undefined, true)
//         }
//     })
const profileUpload = multer({ storage: multerStorage, fileFilter: multerFilter });

module.exports = { profileUpload };


// module.exports = { profileUpload }