
const multer = require('multer');
const path = require('path');
const {v4} = require('uuid');
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const pathToFolder = path.resolve("../backend/upload")
        callback(null, pathToFolder);
    },
    filename: function (req, file, callback) {
        callback(null,v4() + path.extname(file.originalname))
    }
})

const postman = multer({ storage }).array("file");    //attribute name is file = xyz.jpg

module.exports = postman;
