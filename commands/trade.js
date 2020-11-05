module.exports = {
    name: 'trade',
    description: 'Command for setting trade value of assets you have traded! When you purchase or sell an asset, you should put the price you paid here.',
    args: true,
    usage: '<sell | buy> <numberOfAssets> <assetType> <money> <@customer>\n\n**Assets:**\n*Buildings:* AIRPORT, FOB, PORT, RADAR\n*Surface assets:* MBT, AFV, IFV, APC, SAM, SPAAG, SF\n*Aerospace assets:* L, M, H, LA, VL, VTOL, SAT, OV\n*Naval assets:* K, F, DD, CC, BC, BB, CL, CV\n**Weapons:**\n*Aerial:* SRAAM, MRAAM, LRAAM, AGM, ASHM, ATGM, SRSAM ,MRSAM, LRSAM, SEAD\n*Surface:* CRUISE, BALLISTIC, ABM, ASM\n*Bombs:* UNGUI, GUI, EW, RECON, FUEL, GUNPOD',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")
        const units = require('./../units.json');

        try {
            var type = args[0].toLowerCase();
            var amount = parseInt(args[1]);
            var unit = args[2].toUpperCase();
            var money = parseInt(args[3]);
            var nation = cfg.users[message.author.id].nation;      
            var company = false;      

            if(!units.hasOwnProperty(unit)) throw 'AssetType not found. Please retry.';
            if (isNaN(amount) || isNaN(money)) throw 'Argument money or number of assets is not a number. Canceling operation.';
            if (!type.startsWith('sell') && !type.startsWith('buy')) {
                throw 'First argument is not sell or buy.'
            } else if (type.startsWith('buy')) {
                type = false;
            } else {
                type = true;
            }
            if (nation == undefined) throw 'Nation does not exist in our database. Contact moderator or retry.';
            if (cfg.users[message.mentions.users.first().id].nation == undefined) throw "No such user's nation exists.";
        } catch(err) {
            message.channel.send(err);
            return;
        }

        gm.findUnitPrice(unit, message, nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else if (data[0] * 4 * amount > money) {
                message.channel.send('The price of this trade is lower than production cost of the vehicles!');
                return;
            }
            gm.findVertical(cfg.users[message.mentions.users.first().id].nation, 'A', message)
            .then(customer => {
                let col = fn.toCoord(data[1]);
                    transfer(data[2], col, amount, money, message, type)
                    .then(x => {
                        transfer(customer, col, amount, money, message, !type)
                        .then(x => {
                            let msg = ` ${amount} ${unit}s for ${money.toLocaleString()+cfg.money} finished!`;
                            gm.report(message, `<@${message.author.id}> has traded with <@${message.mentions.users.first().id}>` + msg);
                            message.channel.send(`Transaction with ${message.mentions.users.first().username}` + msg);
                            
                        })
                        .catch(err => {
                            message.channel.send(err);
                            return;
                        })
                    })
                    .catch(err => {
                        message.channel.send(err);
                        return;
                    })
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    },
};

//Type true = sell
function transfer(nationRow, unitCol, amount, money, message, type, tab) {
    const fn = require("./../fn");
    return new Promise(function (resolve, reject) {
        fn.ss(['get', `${unitCol + nationRow}`], message)
            .then(unitsAmount => {
                if (type) {
                    unitsAmount = parseInt(unitsAmount) - amount;
                } else {
                    unitsAmount = parseInt(unitsAmount) + amount;
                }
                if(unitsAmount < 0) {
                    reject('Not  enough units to sell!');
                    return;
                }
                fn.ss(['get', `B${nationRow}`], message)
                    .then(balance => {
                        if (type) {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) + money;
                        } else {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) - money;
                        }
                        fn.ss(['set', `${unitCol + nationRow}`, unitsAmount], message)
                            .then(result => {
                                fn.ss(['set', `B${nationRow}`, balance], message)
                                resolve();
                            })
                            .catch(err => reject(err));
                    })
                    .catch(err => reject(err));
            })
            .catch(err => reject(err));
    })
}