import { ss, toCoord } from './fn';
import { findVertical, findHorizontal } from './game';
import { servers } from './config.json';
import units from './units.json';

/**
 * Function finds value in specified column of specified tab. Message passes to sheet function.
 * @param {String} value    Searched value.
 * @param {String} col      Sheet column value.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {String} tab      Sheet tab value.
 */
export function findVertical(value, col, message, tab) { return new Promise(function (resolve, reject) {
    //console.log('Col: ' + col + 'tab: ' + tab);
    ss(['getA', `${col}1`, `${col}100`], message, tab)
        .then(array => {
            //console.log(array);
            var height = 0;
            var rege = new RegExp("^" + value + ".*", "g");
            for (const element of array) {
                height += 1;
                if (rege.test(element[0])) {
                    resolve(height);
                }
            }
            reject('Not found in vertical range.');
        })
        .catch(err => reject('Error in vertical: ' + err));
}); }

/**
 * Function finds value in specified row of specified tab. Message passes to sheet function.
 * @param {String} value    Searched value.
 * @param {String} row      Sheet row value.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {String} tab      Sheet tab value.
 */
export function findHorizontal(value, row, message, tab) { return new Promise(function (resolve, reject) {
    var e = 64; //char A dec num

    var col = 'BA';
    if (tab == 'TechTree') {
        col = 'HO';
    }
    //console.log(col);
    ss(['getA', `A${row}`, `${col + row}`], message, tab)
        .then(array => {
            //console.log(array);
            for (const element of array[0]) {
                e += 1;
                if (element == value) {
                    resolve(e);
                }
            }
            reject('Not found in horizontal range.');
        })
        .catch(err => reject('Error in horizontal: ' + err));
}); }

/**
 * Method finds
 * @param {String} value        Searched nation's value in specified tab.
 * @param {Message} message     Message to retrieve channel to interact with.
 * @param {String} nation       Nation of user.
 * @param {String} tab          Sheet's tab.
 * @param {Boolean} tech        If the searched value is technology.
 * @returns {Promise} [Number, Number, Number, Number] Array Price number in rp or maintenance price, value column, data row and value of the searched value cell.
 */
export function findUnitPrice(value, message, nation, tab, tech) { return new Promise(async function (resolve, reject) {
    //console.log(tab);
    let priceRow = await findVertical('Data', 'A', message, tab).catch(err => console.error('PriceRowErr: ' + err));
    let nationRow = await findVertical(nation, 'A', message, tab).catch(err => console.error('NationRowErr: ' + err));
    let valueCol = await findHorizontal(value, 4, message, tab).catch(err => console.error('PriceColErr: ' + err));

    //If the searched value is technology, sheet function gets node value (0 | 1).
    let price;
    let amount = await ss(['get', `${toCoord(valueCol) + nationRow}`], message, tab);
    amount = parseInt(amount);

    //console.log('Pricerow: ' + priceRow +'NationRow: '+ nationRow +'ValueCol: '+ valueCol);
    if (priceRow == undefined || nationRow == undefined || valueCol == undefined) {
        reject('Wrong name');
    }

    ss(['get', `${toCoord(valueCol) + priceRow}`], message, tab)
        .then(amount => {
            price = parseInt(amount);
            if (tech || ['wpSurface', 'wpAerial', 'systems'].includes(units[value][1])) {
                //If searched value is tech or weapon/electronic system, returns the values.
                resolve([price, valueCol, nationRow, amount]);
            } else if (['other'].includes(units[value][1])) {
                ss(['get', `${toCoord(valueCol) + nationRow}`], message, tab)
                    .then(amount => {
                        resolve([amount, valueCol, nationRow, amount]);
                    }).catch(err => console.error(err));
            } else {
                let techCol;
                findHorizontal('Surface', 1, message)
                    .then(col => {
                        techCol = toCoord(col);
                        //console.log(techCol);
                        ss(['getA', `${techCol}${nationRow}`, `${techCol}${nationRow}`, '3', '0'], message)
                            .then(techLevel => {
                                //console.log(techLevel);
                                switch (units[value][1]) {
                                    case 'surface':
                                        resolve([(price * (techLevel[0][0] / 4 + 0.975)), valueCol, nationRow, amount]);
                                    case 'aerial':
                                        resolve([(price * (techLevel[0][1] / 4 + 0.975)), valueCol, nationRow, amount]);
                                    case 'naval':
                                        resolve([(price * (techLevel[0][2] / 4 + 0.975)), valueCol, nationRow, amount]);
                                    case 'orbital':
                                        resolve([(price * (techLevel[0][3] / 4 + 0.975)), valueCol, nationRow, amount]);
                                    default:
                                        resolve([price, valueCol, nationRow]);
                                }
                            })
                            .catch(err => console.error(err));
                    })
                    .catch(err => console.error(err));
            }
        })
        .catch(err => console.error(err));
}); }

/**
 * Method reports data to the moderators.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {String} data Data to report to the moderators.
 */
export function report(message, data) {
    message.client.channels.cache.get(servers[message.guild.id].main_channel).send(data);
}