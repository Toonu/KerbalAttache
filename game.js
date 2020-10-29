const fs = require('fs');
const {google} = require('googleapis');
const fn = require('./fn');
const gm = require('./game');
const cfg = require('./config.json');

//Function finds first element target in column.
exports.findVertical = function findVertical(target, col, message, tab) {
    return new Promise(function (resolve, reject) {  
        fn.ss(['getA', `${col}1`, `${col}100`], message, tab)
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
exports.findHorizontal = function findHorizontal(target, row, message, tab) {
    return new Promise(function (resolve, reject) {
        var e = 64; //char A dec num
        fn.ss(['getA', `A${row}`, `BA${row}`], message, tab)
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

exports.findUnitPrice = function(unit, message, nation) {
    return new Promise(function(resolve, reject) {
        let nationRow;
        let finPrice;
        let priceRow;

        gm.findVertical('Data', 'A', message)
            .then(prices => {
                priceRow = prices
                gm.findHorizontal(unit, '4', message)
                .then(column => {
                    fn.ss(['get', `${String.fromCharCode(column)}${priceRow}`], message)
                    .then(price => {
                        finPrice = price;
                        gm.findVertical(nation, 'A', message)
                        .then(row => {
                            nationRow = row;
                            gm.findHorizontal('Technology', '1', message)
                            .then(col => {
                                let techCol = fn.toCoord(col);
                                fn.ss(['getA', `${techCol}${nationRow}`, `${techCol}${nationRow}`, '3', '0'], message)
                                .then(result => {
                                    if (['MBT', 'AFV', 'IFV', 'APC', 'SAM', 'SPAA'].includes(unit)) {
                                        resolve(finPrice * ( result[0][0]/4+0.975));
                                    } else if (['L', 'M', 'H', 'L', 'VL', 'VTOL'].includes(unit)) {
                                        resolve(finPrice * ( result[0][1]/4+0.975));
                                    } else if (['K', 'FF', 'DD', 'CC', 'BC', 'BB', 'CV', 'CL'].includes(unit)) {
                                        resolve(finPrice * ( result[0][2]/4+0.975));
                                    } else if (['SAT', 'OV'].includes(unit)) {
                                        resolve(finPrice * ( result[0][3]/4+0.975));
                                    } else {
                                        resolve(finPrice);
                                    }						
                                })
                                .catch(err => reject(err));
                            })
                            .catch(err => {
                                message.channel.send("Wrong unit type.")
                                reject(err);
                            });
                        })
                        .catch(err => reject(err));
                    })
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
    });
}
exports.report = function(message, data) {
    message.client.channels.cache.get(cfg.servers[message.guild.id].main_channel).send(data);
}