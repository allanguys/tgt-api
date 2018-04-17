const fs = require('fs');
const path = require('path');
const { COPYFILE_EXCL } = fs.constants;

fs.copyFile(
    path.resolve(__dirname, '../config.json.default'),
    path.resolve(__dirname, '../config.json'),
    COPYFILE_EXCL,
    (err) => {
        //console.log(err.message);
    }
);
