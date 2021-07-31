const cfg = require('./config.json'), {google} = require('googleapis');
let client;
let gs;
//const {private_key, client_email} = process.env;
const {private_key, client_email} = require('./env.json');


/**
 * Function authorize the bot to manipulate the main sheet.
 */
exports.init = function init() {
    client = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    // noinspection JSValidateTypes
    gs = google.sheets({version: 'v4', auth: client});
};


/**
 * Function returns value of cell in the tab of the sheet.
 * @param cell                  Coordinate of cell.
 * @param sheetTab              Sheet sheetTab.
 * @return {Promise<String>}    Returns cell value or rejects with String error message.
 */
exports.getCell = function getCell(cell, sheetTab) {
    return new Promise(function (resolve, reject) {
        if (isCoordinate(cell)) {
            gs.spreadsheets.values.get({
                spreadsheetId: cfg.sheet,
                range:  `${sheetTab}!${cell}`,
                valueRenderOption: "UNFORMATTED_VALUE"
            })
            .then(data => resolve(data.data.values))
            .catch(error => reject(error.message));
        }
    });
}


/**
 * Function gets array of values between coordinate X and Y in sheet tab. Additionally the array blank spaces are filled with dots. Optionally fullY can be set to true to ignore coordinate check of the second coordinate.
 * @param X                 String First coordinate.
 * @param Y                 String Second coordinate.
 * @param sheetTab          String tab name.
 * @return {Promise<Array>} Returns data resulting array or reject error String message.
 */
exports.getCellArray = function getCellArray(X, Y, sheetTab) {
    return new Promise(function (resolve, reject) {
        if (!isCoordinate(X) || !new RegExp(/[A-Z]+/g).test(Y)) {
            return reject('Coordinate X is not correct.')
        }

        gs.spreadsheets.values.get({
            spreadsheetId: cfg.sheet,
            range: `${sheetTab}!${X}:${Y}`,
            majorDimension: "ROWS",
            valueRenderOption: "UNFORMATTED_VALUE"
        })
        .then(data => {
            let maximalLength = 0;

            //Two loops fill the empty values with dot so they are not ignored in embeds.
            for(const row of data.data.values) {
                for(let column = 0; column < row.length; column++) {
                    if (row[column] === '') {
                        row.splice(column, 1, '.');
                    }
                }
                if (row.length > maximalLength) maximalLength = row.length;
            }

            //Second loop fills in the ends if the row is showrter than maximal row to keep the array rectangular.
            for (let row = 0; row < data.data.values.length; row++) {
                if (row.length < maximalLength) {
                    for (let i = maximalLength - row.length; i > 0; i--) {
                        data.data.values[row].push('.');
                    }
                }
            }

            resolve(data.data.values);
        })
        .catch(error => reject(error.message));
    });
}


/**
 * Function sets cell on coordinate to new value in sheetTab of the sheet.
 * @param coordinate            Coordinate String of cell.
 * @param value                 Value to set. If undefined, cell becomes empty.
 * @param sheetTab                   Tab of sheet where operation takes place.
 * @return {Promise<Array>}     Returns if successful or rejects with String error message.
 */
exports.set = function setInternal(coordinate, value, sheetTab) {
    return new Promise(function (resolve, reject) {
        if (isCoordinate(coordinate)) {
            gs.spreadsheets.values.update({
                spreadsheetId: cfg.sheet,
                range: `${sheetTab}!${coordinate}`,
                valueInputOption: 'RAW',
                resource: {values: [[value]]}
            })
                .then(() => resolve('Operation successful.'))
                .catch(err => reject(err.message));
        }
    });
}


/**
 * Function sets array of values into from the coordinate cell in sheet sheetTab.
 * @param coordinate            String coordinate.
 * @param values                Array of arrays(rows) of values(cols).
 * @param sheetTab                   String sheet sheetTab name.
 * @return {Promise<String>}   Returns String.
 */
exports.setArray = function setAInternal(coordinate, values, sheetTab) {
    return new Promise(function (resolve, reject) {
        const pushData = {
            spreadsheetId: cfg.sheet,
            resource: {
                valueInputOption: 'RAW',
                data: {
                    "range": `${sheetTab}!${coordinate}`,
                    "majorDimension": "ROWS",
                    "values": values,
                }
            },
        };
        gs.spreadsheets.values.batchUpdate(pushData)
            .then(() => resolve('Operation successful.'))
            .catch(err => reject(err.message));
    });
}


/**
 * Function checks if the coordinate is in correct format.
 * @param coordinate    Coordinate to check.
 * @return {boolean}    Returns true/false if correct/wrong.
 */
function isCoordinate(coordinate) {
    return new RegExp(/[A-Z]+[0-9]+/g).test(coordinate);
}


/**
 * Function changes column number into sheet coordinate.
 * @param num           Number to convert
 * @return {string}     Sheet coordinate String.
 */
exports.toCoordinate = function toCoordinate(num) {
    num = parseInt(num);

    if (num > 298) {
        return 'I'+String.fromCharCode(num - 234);
    } else if (num > 272) {
        return 'H'+String.fromCharCode(num - 208);
    } else if (num > 246) {
        return 'G'+String.fromCharCode(num - 182);
    } else if (num > 220) {
        return 'F'+String.fromCharCode(num - 156);
    } else if (num > 194) {
        return 'E'+String.fromCharCode(num - 130);
    } else if (num > 168) {
        return 'D'+String.fromCharCode(num - 104);
    } else if (num > 142) {
        return 'C'+String.fromCharCode(num - 78);
    } else if (num > 116) {
        return 'B'+String.fromCharCode(num - 52);
    } else if (num > 90) {
        return 'A'+String.fromCharCode(num - 26);
    } else {
        return String.fromCharCode(num);
    }
}


/**
 * Function changes column coordinate into number.
 * @param coordinate    Coordinate to convert.
 * @return {[number, number]|[number, number]}
 */
exports.fromCoordinate = function fromCoordinate(coordinate) {
    let letters = 0;

    if (coordinate.charCodeAt(1) > 64) {
        letters += coordinate.charCodeAt(1);
    } else {
        return [coordinate.charCodeAt(0), parseInt(coordinate.substring(1, coordinate.length))];
    }

    let numbers = '';
    for (let i = 0; i < coordinate.length; i++) {
        if (coordinate.charCodeAt(i) < 65) {
            numbers += coordinate.charAt(i);
        }
    }

    if (coordinate.startsWith('I')) {
        letters += 234;
    } else if (coordinate.startsWith('H')) {
        letters += 208;
    } else if (coordinate.startsWith('G')) {
        letters += 182;
    } else if (coordinate.startsWith('F')) {
        letters += 156;
    } else if (coordinate.startsWith('E')) {
        letters += 130;
    } else if (coordinate.startsWith('D')) {
        letters += 104;
    } else if (coordinate.startsWith('C')) {
        letters += 78;
    } else if (coordinate.startsWith('B')) {
        letters += 52;
    } else if (coordinate.startsWith('A')) {
        letters += 26;
    }

    return [letters, parseInt(numbers)];
}
