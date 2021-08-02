const {getCell, setCell} = require("./sheet");

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
                } else if (!unitsAmount) {
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
