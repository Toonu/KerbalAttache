const fs = require('fs');
const {google} = require('googleapis');
const fn = require('./fn');
const gm = require('./game');
const cfg = require('./config.json');
const units = require('./units.json');

//Function finds first element target in column.
exports.findVertical = function findVertical(target, col, message, tab) {
    return new Promise(function (resolve, reject) {
        //console.log('Col: ' + col + 'tab: ' + tab);
        fn.ss(['getA', `${col}1`, `${col}100`], message, tab)
            .then(array => {
                //console.log(array);
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

        var col = 'BA';
        if(tab == 'TechTree') {
            col = 'HO'
        }
        //console.log(col);
        fn.ss(['getA', `A${row}`, `${col + row}`], message, tab)
            .then(array => {
                //console.log(array);
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
exports.findUnitPrice = function(unit, message, nation, tab, tech) {
    return new Promise(async function(resolve, reject) {
        //console.log(tab);
        let priceRow = await gm.findVertical('Data', 'A', message, tab).catch(err => console.error('PriceRowErr: ' + err));
        let nationRow = await gm.findVertical(nation, 'A', message, tab).catch(err => console.error('NationRowErr: ' + err));
        let priceCol = await gm.findHorizontal(unit, 4, message, tab).catch(err => console.error('PriceColErr: ' + err));
        let rp;
        if (tech) {
            rp = await fn.ss(['get', `${fn.toCoord(priceCol) + nationRow}`], message, tab)
        }
        
        //console.log('Priceitems' + priceRow +'n'+ nationRow +'c'+ fn.toCoord(priceCol));
        if(priceRow == undefined || nationRow == undefined || priceCol == undefined) {
            reject('Wrong name');
        }

        
        let price;
        fn.ss(['get', `${fn.toCoord(priceCol) + priceRow}`], message, tab)
        .then(amount => {
            price = parseInt(amount);
            if (tech || ['wpSurface', 'wpAerial', 'systems'].includes(units[unit][1])) {
                resolve([price, priceCol, nationRow, rp]);
            } else if (['other'].includes(units[unit][1])) {
                fn.ss(['get', `${fn.toCoord(priceCol)+nationRow}`], message, tab)
                .then(amount => {
                    resolve([amount, priceCol, nationRow]);
                }).catch(err => console.error(err));
            } else {
                let techCol;
                gm.findHorizontal('Surface', 1, message)
                .then(col => {
                    techCol = fn.toCoord(col);
                    //console.log(techCol);
                    fn.ss(['getA', `${techCol}${nationRow}`, `${techCol}${nationRow}`, '3', '0'], message)
                    .then(techLevel => {
                        //console.log(techLevel);
                        switch(units[unit][1]) {
                            case 'surface':
                                resolve([(price * (techLevel[0][0]/4+0.975)), priceCol, nationRow]);
                            case 'aerial':
                                resolve([(price * (techLevel[0][1]/4+0.975)), priceCol, nationRow]);
                            case 'naval':
                                resolve([(price * (techLevel[0][2]/4+0.975)), priceCol, nationRow]);
                            case 'orbital':
                                resolve([(price * (techLevel[0][3]/4+0.975)), priceCol, nationRow]);
                            default:
                                resolve([price, priceCol, nationRow]);
                        }
                    })
                    .catch(err => console.error(err));
                })
                .catch(err => console.error(err));
            }
        })
        .catch(err => console.error(err));
    });
}
exports.report = function(message, data) {
    message.client.channels.cache.get(cfg.servers[message.guild.id].main_channel).send(data);
}