const gm = require('./game'), cfg = require('./config.json'),
    units = require('./units.json'), {getCell, setCell, getCellArray, toCoordinate} = require("./sheet");

/**
 * Function finds row of target in column of sheet tab.
 * @param target                String of searched target.
 * @param col                   String of column letter.
 * @param tab                   String of tab name.
 * @param height                Height shift
 * @return {Promise<Number>}    Number of row.
 */
exports.findVertical = function findVertical(target, col, tab, height = 1) {
    return new Promise(function (resolve, reject) {
        let max = height + 99;
        getCellArray(`${col + height}`, `${col + max}`, 0, 0, tab)
            .then(array => {
                const regex = new RegExp("^" + target + ".*", "g");
                let result = array.findIndex(function (currentValue) {
                    if (regex.test(currentValue)) return true;
                });
                if (result === -1) {
                    return reject(undefined);
                }
                resolve(result + 1);
            })
            .catch(error => {
                console.error(error)
                reject(error)
            });
    }).catch(error => console.error('Error in vertical: ' + error));
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
        if(tab === 'TechTree') col = 'HQ'

        getCellArray(`A${row}`, `${col + row}`, 0, 0, tab)
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
                result = toCoordinate(result + e + 1);
                resolve(result);
            })
            .catch(error => {
                console.error(error)
                reject(error)
            })
    }).catch(err => console.error('Error in horizontal: ' + err));
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
        if (!tech && ['wpSurface', 'wpAerial', 'systems'].includes(units[target][1])) {
            tab = 'Stockpiles';
        }

        let value;
        let priceRow;
        let nationRow;
        let priceCol;
        let techInfo;
        try {
            priceRow = await gm.findVertical('Data', 'A', tab).catch(e => {reject(e)});
            nationRow = await gm.findVertical(nation, 'A', tab).catch(e => {reject(e)});
            priceCol = await gm.findHorizontal(target, 4, tab).catch(e => {reject(e)});
            value = await getCell(`${priceCol + nationRow}`, tab).catch(e => {reject(e)});
            if (tech) {
                techInfo = await getCellArray(`${priceCol + priceRow}`, `${priceCol + priceRow}`, 0, 1, tab);
                techInfo[0] = parseInt(techInfo[0]);
            }
            if (value === undefined) {
                value = 0;
            } else {
                value = parseInt(value.replace(/[,|$]/g, ''));
            }
        } catch (e) {
            console.error(e);
            reject(e);
        }

        if(priceRow === undefined || nationRow === undefined || priceCol === undefined) {
            reject('Wrong name');
        }
        getCell(`${priceCol + priceRow}`, tab)
        .then(price => {
            price = parseInt(price);
            if (tech || ['other', 'wpSurface', 'wpAerial', 'systems'].includes(units[target][1])) {
                if (!tech) {
                    resolve([price, priceCol, nationRow, value]);
                } else {
                    resolve([techInfo, priceCol, nationRow, value]);
                }
            } else {
                gm.findHorizontal('Surface', 1)
                .then(incrementsCols => {
                    getCellArray(`${incrementsCols}${nationRow}`, `${incrementsCols}${nationRow}`, 3, 0)
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
        }).catch(err => {
            reject(err);
        });
    });
}


/**
 * Function reports information into the moderator channel.
 * @param message   Message object which specifies server to search main channel in.
 * @param report    String with a message to report.
 * @param command   String command name the report originated from.
 */
exports.report = function report(message, report, command = '') {
    let today = new Date();
    let dateTime = `${today.getUTCFullYear()}.${(today.getUTCMonth() < 10 ? '0' : '') + (today.getUTCMonth() + 1)}.${(today.getUTCDate() < 10 ? '0' : '') + today.getUTCDate()} ${today.getUTCHours()}:${(today.getUTCMinutes() < 10 ? '0' : '') + today.getUTCMinutes()}:${(today.getUTCSeconds() < 10 ? '0' : '') + today.getUTCSeconds()}`;
    message.client.channels.cache.get(cfg.servers[message.guild.id].mainid).send(`[${dateTime.padEnd(21)}UTC] [${command}]: ${report}`)
        .catch(networkError => console.error(networkError));
}


/**
 * Function logs a message to the console with formatting..
 * @param report    String with a message to log.
 */
exports.log = function log(report) {
    let today = new Date();
    let dateTime = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    console.log(`[${dateTime} UTC] ${report}`);
}

/**
 * Function makes trade transaction between two countries.
 * @param nationRow             Number of nation row.
 * @param unitCol               String of traded asset col.
 * @param amount                Number of assets traded.
 * @param money                 Number money paid.
 * @param message               Message object to respond to.
 * @param type                  Boolean type of transaction.
 * @param tab                   String tab of sheet.
 * @return {Promise<String>}    Returns result.
 */
exports.transfer = function transfer(nationRow, unitCol, amount, money, message, type, tab) {
    return new Promise(function (resolve, reject) {
        getCell(`${unitCol + nationRow}`, tab)
            .then(unitsAmount => {
                if (type) {
                    unitsAmount = parseInt(unitsAmount) - amount;
                } else if (unitsAmount === undefined) {
                    unitsAmount =  amount;
                } else {
                    unitsAmount = parseInt(unitsAmount) + amount;
                }
                if(unitsAmount < 0) return reject('Not enough units to sell!');
                getCell(`B${nationRow}`)
                    .then(balance => {
                        if (type) {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) + money;
                        } else {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) - money;
                        }
                        setCell( `${unitCol + nationRow}`, unitsAmount, tab)
                            .then(() => {
                                setCell(`B${nationRow}`, balance).then(() => {
                                    resolve('Success.');
                                })
                            })
                            .catch(err => reject(err));
                    })
                    .catch(err => reject(err));
            })
            .catch(err => reject(err));
    })
}
