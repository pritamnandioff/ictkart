const path = require('path');
const AWS = require('aws-sdk');
const KEYS = require('../config/keys');
AWS.config.update({
    accessKeyId: KEYS.AWS_ACCESS_KEY,
    secretAccessKey: KEYS.AWS_SECRET_KEY,
    region: KEYS.AWS_BUCKET_REGION
});
const s3 = new AWS.S3();

module.exports = {
    uploadImage: async (file, multi = false) => {
        try {
            /** for the single image */
            if (file.length === undefined) {
                let pathFile = Date.now() + path.extname(file.name);
                let fileName = await uploadFileAWS(pathFile, file);
                fileName = fileName.split("/").pop();
                return multi === true ? [fileName] : fileName
            }
            else {
                let arrFiles = [];
                for (let ck = 0; ck < file.length; ck++) {
                    if (path.extname(file[ck].name)) {
                        let pathFile = Date.now() + path.extname(file[ck].name);
                        let newFileName = await uploadFileAWS(pathFile, file[ck]);
                        newFileName = newFileName.split("/").pop();
                        arrFiles.push(newFileName);
                    }
                }
                return arrFiles;
            }
        }
        catch (err) {
            console.log(err)
            return 0;
        }
    }
}
uploadFileAWS = async (pathFile, file) => {
    let params = {
        Bucket: KEYS.AWS_BUCKET_NAME,
        Key: pathFile,
        Body: file.data,
    }
    return new Promise((resolve, reject) => {
        s3.upload(params, async (err, data) => {
            if (err) {
                return reject({
                    status: false,
                    message: err.message.toString()
                });
            } else {
                return resolve(data);
            }
        });
    }).then(async (result) => {
        return result.key;
    }).catch((err) => {
        console.log(err)
        return 0;
    });
}

changeFileName = async (name) => {
    return await Date.now() + path.extname(name);
}