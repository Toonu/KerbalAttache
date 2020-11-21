const cfg = require('./config.json'), {google} = require('googleapis'), sh = require('./sheet');
let client;
let gs;
const {private_key, client_email} = process.env;
//const {private_key, client_email} = require('./env.json');


/**
 * Function authorize the bot to manipulate the main sheet.
 */
exports.init = function init() {
    client = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    // noinspection JSValidateTypes
    gs = google.sheets({version: 'v4', auth: client});
};


/**
 * Function returns value of cell at coordinate of the tab in the sheet.
 * @param coordinate            Coordinate of cell.
 * @param tab                   Sheet tab.
 * @return {Promise<String>}    Returns cell value or rejects with String error message.
 */
exports.get = function getInternal(coordinate,tab = 'Maintenance') {
    return new Promise(function (resolve, reject) {
        if (isCoordinate(coordinate)) {
            const request = {
                spreadsheetId: cfg.sheet,
                range:  `${tab}!${coordinate}`
            };
            gs.spreadsheets.values.get(request)
                .then(data => {
                    let dataArray = data.data.values;

                    if (dataArray !== undefined) {
                        resolve(dataArray[0][0]);
                    } else {
                        resolve(undefined);
                    }
                })
                .catch(err => {
                    reject(err.message);
                });
        }
    });
}


/**
 * Function gets array of values from cordX to cordY with extension of col and row Sizes in tab of sheet.
 * @param cordX                 String First coordinate.
 * @param cordY                 String Second coordinate.
 * @param colSize               Number Size extension in columns.
 * @param rowSize               Number Size extension in rows.
 * @param tab                   String tab name.
 * @return {Promise<Array>}     Returns data array or rejects String error message.
 */
exports.getArray = function getAInternal(cordX, cordY, colSize = 0, rowSize = 0, tab = 'Maintenance') {
    return new Promise(function (resolve, reject) {
        rowSize = parseInt(rowSize);
        colSize = parseInt(colSize);

        let temporaryCordY;
        if (!isCoordinate(cordX) || !isCoordinate(cordY)) {
            reject('Coordinates not correct.')
        } else if (colSize !== 0 || rowSize !== 0) {
            temporaryCordY = sh.fromCoordinate(cordY);
            cordY = sh.toCoordinate(temporaryCordY[0] + colSize) + (temporaryCordY[1] + rowSize);
        }

        const request = {
            spreadsheetId: cfg.sheet,
            "range": `${tab}!${cordX}:${cordY}`,
            "majorDimension": "ROWS"
        };

        gs.spreadsheets.values.get(request)
            .then(data => {
                for(rowSize of data.data.values) {
                    for(let i = 0; i < rowSize.length; i++) {
                        if (rowSize[i] === '') {
                            rowSize.splice(i, 1, '.');
                        }
                    }
                }
                let l = 0;

                for (let
                    row of data.data.values) {
                    if (row.length > l) {
                        l = row.length;
                    }
                }

                for (let i = 0; i < data.data.values.length; i++){
                    let size = data.data.values[i];
                    if (size.length < l) {
                        for (let li = l - size.length; li > 0; li--) {
                            size.push('.');
                        }
                    }
                }

                resolve(data.data.values);
            })
            .catch(err => {
                reject(err.message);
            });
    });
}


/**
 * Function sets cell on coordinate to new value in tab of the sheet.
 * @param coordinate            Coordinate String of cell.
 * @param value                 Value to set. If undefined, cell becomes empty.
 * @param tab                   Tab of sheet where operation takes place.
 * @return {Promise<Array>}     Returns if successful or rejects with String error message.
 */
exports.set = function setInternal(coordinate, value = '', tab  = 'Maintenance') {
    return new Promise(function (resolve, reject) {
        if (isCoordinate(coordinate)) {
            const pushData = {
                spreadsheetId: cfg.sheet,
                range: `${tab}!${coordinate}`,
                valueInputOption: 'RAW',
                resource: {values: [[value]]}
            };
            gs.spreadsheets.values.update(pushData)
                .then(() => {
                    resolve('Operation successful.')
                })
                .catch(err => {
                    reject(err.message)
                });
        }
    });
}


/**
 * Function sets array of values into from the coordinate cell in sheet tab.
 * @param coordinate            String coordinate.
 * @param values                Array of arrays(rows) of values(cols).
 * @param tab                   String sheet tab name.
 * @return {Promise<String>}   Returns String.
 */
exports.setArray = function setAInternal(coordinate, values, tab = 'Maintenance') {
    return new Promise(function (resolve, reject) {
        const pushData = {
            spreadsheetId: cfg.sheet,
            resource: {
                valueInputOption: 'RAW',
                data: {
                    "range": `${tab}!${coordinate}`,
                    "majorDimension": "ROWS",
                    "values": values,
                }
            },
        };
        gs.spreadsheets.values.batchUpdate(pushData)
            .then(() => {
                resolve('Operation successful.')
            })
            .catch(err => {
                reject(err.message);
            });
    });
}


/**
 * Function checks if the coordinate is in correct format.
 * @param coordinate    Coordinate to check.
 * @return {boolean}    Returns true/false if correct/wrong.
 */
function isCoordinate(coordinate) {
    let regExp = new RegExp(/[A-Z]+[0-9]+/g);
    return regExp.test(coordinate.toUpperCase());
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
