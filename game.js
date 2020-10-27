const fs = require('fs');
const {google} = require('googleapis');
const fn = require('./fn');
const gm = require('./game');
const cfg = require('./config.json');

//Function finds first element target in column.
function findVertical(target, col, message, bool) {
    return new Promise(function (resolve, reject) {  
        fn.ss(['getA', `${col}1`, `${col}100`], message, bool, 'Maintenance')
            .then(array => {
                var height = 0;
                for (const element of array) {
                    height += 1;
                    if (element[0] == target) {
                        resolve(height);
                }
            }
            reject('Not found in vertical range.');
            })
            .catch(err => reject('Error in vertical: ' + err));
    });
}

//Function finds first row containing the target in row.
function findHorizontal(target, row, message, bool) {
    return new Promise(function (resolve, reject) {
        var e = 64; //char A dec num
        fn.ss(['getA', `A${row}`, `BA${row}`], message, bool, 'Maintenance')
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
        findVertical('Data', 'A', message)
            .then(prices => {
                findHorizontal(unit, '4', message)
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