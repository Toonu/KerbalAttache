const fs = require('fs');
const cfg = require('./config.json')
const {google} = require('googleapis');
var client;
const {CLIENT_TOKEN, type, project_id, private_key_id, private_key, client_email} = process.env;

exports.init = function () {
    client = new google.auth.JWT(client_email, null, private_key, ['https://www.googleapis.com/auth/spreadsheets']);
};
exports.ss = function (args, message, tab) {
    return new Promise(function (resolve, reject) {
        client.authorize(function(err,tokens) {
            try {
                if (err) throw 'Autorization failed.' + err;
                else {
                    const gs = google.sheets({version: 'v4', auth: client});
    
                    if (!checkCoordinate(args[1])) throw 'Wrong first coordinate input';
                    args[1] = args[1].toUpperCase();
    
                    if (tab == undefined) {
                        tab = 'Maintenance';
                    }

                    if (args[0].startsWith('getA')) {
                        args[2] = args[2].toUpperCase();
                        if (!checkCoordinate(args[2])) throw 'Wrong second coordinate input.';

                        resolve(getAInternal(args[1], args[2], args[3], args[4], message, gs, tab))
                        .catch(err => reject(err));
                    } else if (args[0].startsWith('set')) {
                        resolve(setInternal(args[1], args[2], message, gs, tab))
                        .catch(err => reject(err));
                    } else if (args[0].toLowerCase().startsWith('get')) {
                        resolve(getInternal(args[1], message, gs, tab))
                        .catch(err => reject(err));
                    }
                }
            } catch(err) {
                reject(err);
            }
        })
    })
};

function getInternal(x,message,gs,tab) { 
    return new Promise(function (resolve, reject) {
        const getData = {
        spreadsheetId: cfg.sheet,
        range:  `${tab}!${x}`
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
        spreadsheetId: cfg.sheet,
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
function setInternal(x, data, message, gs,tab) {
    return new Promise(function (resolve, reject) {
        if (data == undefined) {
                message.channel.send('Data empty. Operation failed.');
                return false;
            } 
            try {
                const pushData = {
                    spreadsheetId: cfg.sheet,
                    range: `${tab}!${x}`,
                    valueInputOption: 'RAW',
                    resource: {values: [[data]]}
                };
                gs.spreadsheets.values.update(pushData)
                    .then(resolve(true))
                    .catch(reject);
            } catch(error) {
                message.channel.send(`Operation failed: ${error.message}`);
                reject(false);
            }
        });
    };


function checkCoordinate(x,message) {
    let coord = new RegExp(/[A-Z]+[0-9]+/g);
    if (coord.test(x)) {
        return true;
    }
    return false;
}

exports.toCoord = function (num) {
    num = parseInt(num);
    let result;

    if (num > 298) {
        result = 'I'+String.fromCharCode(num - 234);
    } else if (num > 272) {
        result = 'H'+String.fromCharCode(num - 208);
    } else if (num > 246) {
        result = 'G'+String.fromCharCode(num - 182);
    } else if (num > 220) {
        result = 'F'+String.fromCharCode(num - 156);
    } else if (num > 194) {
        result = 'E'+String.fromCharCode(num - 130);
    } else if (num > 168) {
        result = 'D'+String.fromCharCode(num - 104);
    } else if (num > 142) {
        result = 'C'+String.fromCharCode(num - 78);
    } else if (num > 116) {
        result = 'B'+String.fromCharCode(num - 52);
    } else if (num > 90) {
        result = 'A'+String.fromCharCode(num - 26);
    } else {
        result = String.fromCharCode(num);
    }

    //console.log('ColumnBy ' + result);
    return result;
}
