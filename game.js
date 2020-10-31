const fs = require('fs');
const {google} = require('googleapis');
const fn = require('./fn');
const gm = require('./game');
const cfg = require('./config.json');
const units = require('./units.json');

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

//Function finds first row containing the target in row. Returns char number.
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

/*
Finds unit maintenance price with reflection to the nation technological level.
Returns the int maintenance price, column of the price and row of the nation.
*/
exports.findUnitPrice = async function(unit, message, nation, tab) {
    return new Promise(function(resolve, reject) {
        let priceRow = await gm.findVertical('Data', 'A', message, tab).catch(err => console.error(err));
        let nationRow = await gm.findVertical(nation, 'A', message, tab).catch(err => console.error(err));
        let priceCol = await gm.findHorizontal(unit, 4, message, tab).catch(err => console.error(err));
        let price = await parseInt(fn.ss(['get', `${fn.toCoord(priceCol)}${priceRow}`], message, tab).catch(err => console.error(err)));

        if (['wpSurface', 'wpAerial', 'systems'].includes(units[unit][1])) {
            resolve([price, priceCol, nationRow]);
        } else {
            let techCol = await fn.toCoord(gm.findHorizontal('Technology', 1, message)).catch(err => console.error(err));
            fn.ss(['getA', `${techCol}${nationRow}`, `${techCol}${nationRow}`, '3', '0'], message)
            .then(techLevel => {
                switch(units[unit][1]) {
                    case 'surface':
                        resolve([price * (techLevel[0][0]/4+0.975), priceCol, nationRow]);
                    case 'aerial':
                        resolve([price * (techLevel[0][1]/4+0.975), priceCol, nationRow]);
                    case 'naval':
                        resolve([price * (techLevel[0][2]/4+0.975), priceCol, nationRow]);
                    case 'orbital':
                        resolve([price * (techLevel[0][3]/4+0.975), priceCol, nationRow]);
                    default:
                        resolve([price, priceCol, nationRow]);
                }
            })
            .catch(reject());
        }
    });
}
exports.report = function(message, data) {
    message.client.channels.cache.get(cfg.servers[message.guild.id].main_channel).send(data);
}