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
 * @param dominantColumn    Bool if sort result by column.
 * @return {Promise<Array>} Returns data resulting array or reject error String message.
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
                if (row.length > maximalLength) maximalLength = row.length;
            }

            /**
            //Two loops fill the empty values with dot so they are not ignored in embeds.
            for(const row of data.data.values) {
                for(let column = 0; column < row.length; column++) {
                    if (row[column] === '') {
                        row.splice(column, 1, '.');
                    }
                }
                if (row.length > maximalLength) maximalLength = row.length;
            }
            **/
            //Second loop fills in the ends if the row is showrter than maximal row to keep the array rectangular.
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
}


/**
 * Function sets coordinate cell to a new value in sheet tab.
 * @param coordinate            Coordinate String of cell.
 * @param value                 Value to set. If undefined, cell becomes empty.
 * @param sheetTab              Tab of sheet where operation takes place.
 * @return {Promise<Array>}     Returns if successful or rejects with String error message.
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
}


/**
 * Function sets array of values into from the coordinate cell in sheet sheetTab.
 * @param coordinate            String coordinate.
 * @param values                Array of arrays(rows) of values(cols).
 * @param sheetTab              String sheet sheetTab name.
 * @return {Promise<String>}    Returns String with success or error message reject..
 */
exports.setCellArray = function setCellArray(coordinate, values, sheetTab, dominantColumn = false) {
    return new Promise(function (resolve, reject) {
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
}


/**
 * Function checks if the coordinate is in correct format.
 * @param coordinate    Coordinate to check.
 * @param ignoreNumber  Bool that allows ignoring coordinate number.
 * @return {boolean}    Returns true/false if correct/wrong.
 */
function isCoordinate(coordinate, ignoreNumber = false) {
    if (ignoreNumber) {
        return new RegExp(/[A-Z]+/g).test(coordinate);
    }
    return new RegExp(/[A-Z]+[0-9]+/g).test(coordinate);
}