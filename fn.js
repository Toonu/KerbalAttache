import { sheet } from './config.json';
import { google } from 'googleapis';
const {private_key, client_email} = process.env;
var client;

/**
 * Method authenticates the bot for editing the sheets.
 */
export function init () {
    client = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);
}

/**
 * Method gets data from sheet.
 * @param {*} args              Arguments array [coord x, coord y, size, size, tab]
 * @param {Message} message     Message to retrieve channel to interact with.
 * @param {String} tab          Tab of sheet from which the data is requested.
 * @returns {Promise}           with value or array of data.
 */
export function ss(args, message, tab) { return new Promise(function (resolve, reject) {
    client.authorize((err, tokens) => {
        try {
            if (err) throw 'Autorization failed.' + err;
            if (!checkCoordinate(args[1])) throw 'Wrong first coordinate input';
            else {
                args[1] = args[1].toUpperCase();
                const gs = google.sheets({ version: 'v4', auth: client });   
                if (tab == undefined) {
                    tab = 'Maintenance';
                }

                if (args[0].startsWith('getA')) {
                    args[2] = args[2].toUpperCase();
                    if (!checkCoordinate(args[2]))
                        throw 'Wrong second coordinate input.';
                    console.log("A");
                    resolve(getAInternal(args[1], args[2], args[3], args[4], message, gs, tab))
                        .catch(err => reject(err));
                } else if (args[0].startsWith('setA')) {
                    console.log("B");
                    resolve(setAInternal(args[1], args[2], message, gs, tab))
                        .catch(err => reject(err));
                } else if (args[0].startsWith('set')) {
                    console.log("C");
                    resolve(setInternal(args[1], args[2], gs, tab))
                        .catch(err => reject(err));
                } else if (args[0].toLowerCase().startsWith('get')) {
                    resolve(getInternal(args[1], message, gs, tab))
                        .catch(err => reject(err));
                }
            }
        } catch (err) {
            reject(err);
        }
    });
});     }

/**
 * Method returns data of one cell.
 * @param {String} x            Returned data cell coordinate. 
 * @param {Message} message     Message to retrieve channel to interact with.
 * @param {google.sheets} gs    Google sheets API.
 * @param {String} tab          Sheet tab to search in.
 */
function getInternal(x,gs,tab) { 
    return new Promise((resolve, reject) => {
        const getData = {
            spreadsheetId: sheet,
            range: `${tab}!${x}`
        };
        gs.spreadsheets.values.get(getData)
            .then(data => {
                let dataArray = data.data.values;

                if (dataArray != undefined) {
                    resolve(dataArray[0][0]);
                    return;
                }
                resolve(false);
            })
            .catch(reject);
    });
}

/**
 * Function for getting array of specified cells.
 * @param {String} x            First coordinate of returned array.
 * @param {String} y            Ending coordinate of returned array.
 * @param {Number} c            Extension of columns of returned array.
 * @param {Number} r            Extension of rows of returned array.
 * @param {Message} message     Message to retrieve channel to interact with.
 * @param {google.sheets} gs    Google Sheets API.
 * @param {String} tab          Sheet tab to search in.
 */
function getAInternal(x, y, c, r, message, gs, tab) {
    return new Promise(function (resolve, reject) {
        try {
        if (parseInt(c) < 0 || parseInt(r) < 0 || c == undefined || r == undefined) {
            c = 0, r = 0;
        };
        r = parseInt(r), c = parseInt(c), newY = '', newYNum = '';

        for (let ch of y) {
            let coord = new RegExp(/[^0-9]+/g);
            if (coord.test(ch)) {
                newY += ch;
            } else {
                newYNum += ch;
            }
        }
        
        let intermediate = newY.charCodeAt(newY.length-1) + c;

        if (intermediate > 90) {
            newY = 'A' + newY;
            intermediate -= 25;
            }
            newY = newY.substring(0, newY.length - 1) + String.fromCharCode(intermediate);
            if (r > 0) {
                newYNum = parseInt(newYNum) + r; 
            }
            y = newY + newYNum;

        } catch (err) {
            message.channel.send(err);
            reject(false);
        }
            
        const getData = {
        spreadsheetId: sheet,
        range: `${tab}!${x}:${y}`
        };

        gs.spreadsheets.values.get(getData)
            .then(data => {
                for(r of data.data.values) {
                    var i = 0;
                    for(i; i < r.length; i++) {
                        if (r[i] == '') {
                            r.splice(i, 1, '.');
                        }
                    }
                }
                resolve(data.data.values);
            })
            .catch(reject);
    });
};

/**
 * Function for setting data of single cell.
 * @param {String} x            Cell coordinate to push the data into.
 * @param {String} data         Data pushed into the specified coordinate.
 * @param {google.sheets} gs    Google Sheets API.
 * @param {String} tab          Sheet tab worked with.
 */
function setInternal(x, data, gs, tab) {
    return new Promise(function (resolve, reject) {
        try {
            if (data == undefined) throw 'Data empty. Operation failed.';
            const pushData = {
                spreadsheetId: sheet,
                range: `${tab}!${x}`,
                valueInputOption: 'RAW',
                resource: {values: [[data]]}
            };
            gs.spreadsheets.values.update(pushData)
                .then(resolve(true))
                .catch(reject);
        } catch(err) {
            reject(`Operation failed: ${err.message}`);
        }
    });
};

/**
 * Function for setting data of array of cells.
 * @param {String} x            Cell coordinate to push the data into. (Will automatically expand by the size of the dataIn array size).
 * @param {String} dataIn       Data pushed into the specified coordinate.
 * @param {google.sheets} gs    Google Sheets API.
 * @param {String} tab          Sheet tab worked with.
 */
function setAInternal(x, dataIn, message, gs, tab) {
    return new Promise((resolve, reject) => {
            if (dataIn == undefined) {
                message.channel.send('Data empty. Operation failed.');
                return false;
            }
            try {
                const pushData = {
                    spreadsheetId: sheet,
                    resource: {
                        valueInputOption: 'RAW',
                        data: {
                            "range": `${tab}!${x}`,
                            "majorDimension": "ROWS",
                            "values": dataIn,
                        }
                    },
                };
                console.log(pushData);
                gs.spreadsheets.values.batchUpdate(pushData)
                    .then(resolve(true))
                    .catch(err => {
                        console.log(err);
                        reject();
                    });
            } catch (error) {
                message.channel.send(`Operation failed: ${error.message}`);
                reject(false);
            }
        });
};

/**
 * Function for checking if String is a coordinate.
 * @param {String} x            Coordinate string to check. (Correct format of eg. A1)   
 */
function checkCoordinate(x) {
    let coord = new RegExp(/[A-Z]+[0-9]+/g);
    if (coord.test(x)) return true;
    return false;
}

/**
 * Function for converting column number into letter of column.
 * @param {Number} num Number to convert.
 */
export function toCoord(num) {
    num = parseInt(num);

    if (num > 298) {
        return 'I' + String.fromCharCode(num - 234);
    } else if (num > 272) {
        return 'H' + String.fromCharCode(num - 208);
    } else if (num > 246) {
        return 'G' + String.fromCharCode(num - 182);
    } else if (num > 220) {
        return 'F' + String.fromCharCode(num - 156);
    } else if (num > 194) {
        return 'E' + String.fromCharCode(num - 130);
    } else if (num > 168) {
        return 'D' + String.fromCharCode(num - 104);
    } else if (num > 142) {
        return 'C' + String.fromCharCode(num - 78);
    } else if (num > 116) {
        return 'B' + String.fromCharCode(num - 52);
    } else if (num > 90) {
        return 'A' + String.fromCharCode(num - 26);
    } else {
        return String.fromCharCode(num);
    }
}
