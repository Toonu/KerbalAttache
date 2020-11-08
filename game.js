const gm = require('./game'), cfg = require('./config.json'),
    units = require('./units.json'), {get, getArray, toCoordinate} = require("./sheet");

/**
 * Function finds row of target in column of sheet tab.
 * @param target                String of searched target.
 * @param col                   String of column letter.
 * @param tab                   String of tab name.
 * @return {Promise<Number>}    Number of row.
 */
exports.findVertical = function findVertical(target, col, tab) {
    return new Promise(function (resolve, reject) {
        getArray(`${col}1`, `${col}100`, 0, 0, tab)
            .then(array => {
                const regex = new RegExp("^" + target + ".*", "g");
                let result = array.findIndex(function (currentValue) {
                    if (regex.test(currentValue)) return true;
                });
                if (result === -1) {
                    reject(undefined);
                }
                resolve(result + 1);
            })
            .catch((err) => reject(console.log(err)));
    }).catch(err => console.log('Error in vertical: ' + err));
}


/**
 * Function returns targets column in row of sheet tab.
 * @param target                String of searched target.
 * @param row                   Number of row.
 * @param tab                   String of tab name.
 * @return {Promise<String>}    Letter of column.
 */
exports.findHorizontal = function findHorizontal(target, row, tab) {
    return new Promise(function (resolve, reject) {
        let e = 64; //char A dec num

        let col = 'BA';
        if(tab === 'TechTree') col = 'HO'

        getArray(`A${row}`, `${col + row}`, 0, 0, tab)
            .then(array => {
                const regex = new RegExp("^" + target + ".*", "g");
                let result = array[0].findIndex(function (currentValue) {
                    if (regex.test(currentValue)) {
                        return true;
                    }
                });
                if (result === -1) {
                    reject(undefined);
                }
                resolve(toCoordinate(result + e + 1));
            })
            .catch((err) => reject(console.log(err)));
    }).catch(err => console.log('Error in horizontal: ' + err));
}


/**
 * Function finds target in nation's data of sheet tab. Tech true if tech tree item.
 * @param target                    String searched item.
 * @param nation                    String nation name.
 * @param tech                      Boolean true if tech tree search.
 * @param tab                       Sheet tab name.
 * @return {Promise<Array>}         Array of [BottomPrice, Column of item, Row of nation, Value of nation's item].
 */
exports.findData = function findData(target, nation, tech, tab) {
    return new Promise(async function(resolve, reject) {
        let priceRow = await gm.findVertical('Data', 'A', tab).catch(err => console.error('PriceRowErr: ' + err));
        let nationRow = await gm.findVertical(nation, 'A', tab).catch(err => console.error('NationRowErr: ' + err));
        let priceCol = await gm.findHorizontal(target, 4).catch(err => console.error('PriceColErr: ' + err));
        let value = await get(`${priceCol + nationRow}`, tab).catch(err => console.error('PriceColErr: ' + err));
        value = parseInt(value);

        if(priceRow === undefined || nationRow === undefined || priceCol === undefined) {
            reject('Wrong name');
        }
        get(`${priceCol + priceRow}`, tab)
        .then(price => {
            price = parseInt(price);
            if (tech || ['other', 'wpSurface', 'wpAerial', 'systems'].includes(units[target][1])) {
                resolve([price, priceCol, nationRow, value]);
            } else {
                gm.findHorizontal('Surface', 1)
                .then(incrementsCols => {
                    getArray(`${incrementsCols}${nationRow}`, `${incrementsCols}${nationRow}`, 3, 0)
                    .then(techLevel => {
                        switch(units[target][1]) {
                            case 'surface':
                                resolve([(price * (techLevel[0][0]/4+0.975)), priceCol, nationRow, value]);
                                break;
                            case 'aerial':
                                resolve([(price * (techLevel[0][1]/4+0.975)), priceCol, nationRow, value]);
                                break;
                            case 'naval':
                                resolve([(price * (techLevel[0][2]/4+0.975)), priceCol, nationRow, value]);
                                break;
                            case 'orbital':
                                resolve([(price * (techLevel[0][3]/4+0.975)), priceCol, nationRow, value]);
                                break;
                            default:
                                resolve([price, priceCol, nationRow]);
                        }
                    }).catch(err => console.error(err));
                }).catch(err => console.error(err));
            }
        }).catch(err => console.error(err));
    });
}

/**
 * Function reports to the moderator channel the specified report String.
 * @param message   Message object which specifies server to search main channel in.
 * @param report    String with a message to report.
 */
exports.report = function report(message, report) {
    let today = new Date();
    let dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    message.client.channels.cache.get(cfg.servers[message.guild.id].main_channel).send(`[${dateTime} UTC]: ${report}`);
}