const fs = require("fs");
const path = require("path");
const saveFile = function (fileName, fileData){
    return new Promise((resolve, reject) => {
        fs.writeFile(path.resolve(__dirname, '../files/', fileName), fileData, err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        });
    })
}
module.exports = saveFile
