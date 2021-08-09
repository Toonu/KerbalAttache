const cfg = require('./config.json'), {google} = require('googleapis');
let client;
let gs;
//const {private_key, client_email} = process.env;
const {private_key, client_email} = require('./env.json');


/**
 * Function authorizes the bot to manipulate the main sheet.
 */
exports.init = function init() {
    client = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    gs = google.sheets({version: 'v4', auth: client});
};


/**
 * Function returns value of cell in the tab of the sheet.
 * @param {string} cell         coordinate of cell.
 * @param {string} sheetTab     sheet tab name.
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
            .then(data => resolve(data.data.values[0][0]))
            .catch(error => reject(error.message));
        }
    });
};


/**
 * Function returns an data array from the sheet tab's specified coordinates.
 * Additionally, the array is made rectangular by filling shorter rows.
 * @param {string} X                    array first coordinate.
 * @param {string} Y                    array end coordinate.
 * @param {string} sheetTab             sheet tab name.
 * @param {boolean} dominantColumn      true if the array is returned transposed.
 * @return {Promise<Array>}             Returns data array or reject error String message.
 */
exports.getCellArray = function getCellArray(X, Y, sheetTab, dominantColumn = false) {
    return new Promise(function (resolve, reject) {
        if (!isCoordinate(X) || !isCoordinate(Y, true)) {
            return reject('Coordinate X is not correct.')
        }

        gs.spreadsheets.values.get({
            spreadsheetId: cfg.sheet,
            range: `${sheetTab}!${X}:${Y}`,
            majorDimension: dominantColumn ? 'COLUMNS' : 'ROWS',
            valueRenderOption: "UNFORMATTED_VALUE"
        })
        .then(data => {
            let maximalLength = 0;

            for (const row of data.data.values) {
                if (row.length > maximalLength) {
                    maximalLength = row.length;
                }
            }

            //Second loop fills in the ends if the row is shorter than maximal row to keep the array rectangular.
            for (let row = 0; row < data.data.values.length; row++) {
                if (data.data.values[row].length < maximalLength) {
                    for (let i = maximalLength - data.data.values[row].length; i > 0; i--) {
                        data.data.values[row].push('');
                    }
                }
            }

            resolve(data.data.values);
        })
        .catch(error => reject(error.message));
    });
};


/**
 * Function writes value into a cell at the specified coordinate in sheet tab.
 * @param {string} coordinate   target cell coordinate.
 * @param {string || number} value        value to write, undefined makes the cell empty.
 * @param {string} sheetTab     sheet tab name.
 * @return {Promise<Array>}     Returns string success message or rejects with an error message.
 */
exports.setCell = function setCell(coordinate, value, sheetTab) {
    return new Promise(function (resolve, reject) {
        if (isCoordinate(coordinate)) {
            gs.spreadsheets.values.update({
                spreadsheetId: cfg.sheet,
                range: `${sheetTab}!${coordinate}`,
                valueInputOption: 'RAW',
                resource: {values: [[value]]}
            })
                .then(() => resolve('Operation successful.'))
                .catch(error => reject(error.message));
        }
    });
};


/**
 * Function writes array of values into the sheet tab on specified coordinates.
 * @param {string} coordinate           coordinate/s of write target.
 * @param {Array} values                Array of arrays(rows) of values(cols). Must be in a [Data] format.
 * @param {string} sheetTab             sheet tab name.
 * @param {boolean} dominantColumn      true if the array is transposed.
 * @return {Promise<String>}            Returns string success message or rejects with an error message.
 */
exports.setCellArray = function setCellArray(coordinate, values, sheetTab, dominantColumn = false) {
    return new Promise(function (resolve, reject) {
        // noinspection JSCheckFunctionSignatures
        gs.spreadsheets.values.batchUpdate({
            spreadsheetId: cfg.sheet,
            resource: {
                valueInputOption: 'RAW',
                responseValueRenderOption: 'UNFORMATTED_VALUE',
                data: {
                    "range": `${sheetTab}!${coordinate}`,
                    "majorDimension": dominantColumn ? 'COLUMNS' : 'ROWS',
                    "values": values,
                }
            },
        }).then(() => resolve('Operation successful.'))
            .catch(error => reject(error.message));
    });
};


exports.deleteRow = async function deleteRow(row, sheetTab) {
    return new Promise(async function (resolve, reject) {
        // noinspection JSCheckFunctionSignatures
    
        let tabId;
        let sheetMetadata = await gs.spreadsheets.get({spreadsheetId: cfg.sheet});
        for (let tab = 0; tab < sheetMetadata.data.sheets.length; tab++) {
            if (sheetMetadata.data.sheets[tab].properties.title === sheetTab) {
                tabId = sheetMetadata.data.sheets[tab].properties.sheetId;
                break;
            }
        }
        
        gs.spreadsheets.batchUpdate({
            "spreadsheetId": cfg.sheet,
            "requestBody": {
                "requests": [{
                    "deleteDimension": {
                        "range": {
                            "sheetId": tabId,
                            "dimension": "ROWS",
                            "startIndex": row - 1,
                            "endIndex": row
                        }
                    }
                }]
            }
        }
        
        ).then(() => resolve('Operation successful.'))
        .catch(error => reject(error.message));
    });
};

/**
 * Function checks if the coordinate is in correct format.
 * @param {string} coordinate       Checked coordinate.
 * @param {boolean} ignoreNumber    Bool allowing ignoring the coordinate number.
 * @return {boolean}                Returns true for correct format, else false.
 * @private
 */
function isCoordinate(coordinate, ignoreNumber = false) {
    if (ignoreNumber) {
        return new RegExp(/[A-Z]+/g).test(coordinate);
    }
    return new RegExp(/[A-Z]+[0-9]+/g).test(coordinate);
}


/**
 * Function converts array number to sheet column letters where 0 marks column A.
 * @param {number} num  Number to convert.
 * @return {string}     Returns column letter coordinate string.
 */
exports.toColumn = function toColumn(num) {
    let column = '';
    let preceding = 0;
    while (num > 25) {
        num -= 26;
        preceding++;
    }
    if (preceding !== 0) {
        column += String.fromCharCode(64 + preceding);
    }
    column += String.fromCharCode(65 + num);
    return column;
};
