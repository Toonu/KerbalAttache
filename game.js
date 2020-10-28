const fs = require('fs');
const {google} = require('googleapis');
const fn = require('./fn');
const gm = require('./game');
const cfg = require('./config.json');

//Function finds first element target in column.
exports.findVertical = function findVertical(target, col, message) {
    return new Promise(function (resolve, reject) {  
        fn.ss(['getA', `${col}1`, `${col}100`], message)
            .then(array => {
                var height = 0;
                var rege = new RegExp("^"+target+".*", "g");
                for (const element of array) {
                    height += 1;
                    if (rege.test(element[0])) {
                        resolve(height);
                }
            }
            reject('Not found in vertical range.');
            })
            .catch(err => reject('Error in vertical: ' + err));
    });
}

//Function finds first row containing the target in row.
exports.findHorizontal = function findHorizontal(target, row, message) {
    return new Promise(function (resolve, reject) {
        var e = 64; //char A dec num
        fn.ss(['getA', `A${row}`, `BA${row}`], message)
            .then(array => {
            for (const element of array[0]) {
                e += 1;
                if (element == target) {
                    resolve(e);
                }
            }
            reject('Not found in horizontal range.');
            })
            .catch(err => reject('Error in horizontal: ' + err));
    });
}

exports.findUnitPrice = function(unit, message) {
    return new Promise(function(resolve, reject) {
        gm.findVertical('Data', 'A', message)
            .then(prices => {
                gm.findHorizontal(unit, '4', message)
                    .then(column => {
                        fn.ss(['get', `${String.fromCharCode(column)}${prices}`], message)
                            .then(resolve)
                            .catch(err => reject(err));
                    })
                    .catch(err => message.channel.send('Error Horizontal - ' + err));
            })
            .catch(err => message.channel.send('Error Vertical - ' + err));
    });
}
exports.report = function(message, data) {
    //message.client.channels.cache.get(cfg.main_channel).send(data);
    message.client.channels.cache.get('768476039496073227').send(data);
}