const cfg = require("./../config.json"), fn = require("./../fn"), gm = require("./../game"),
    units = require('./../units.json');
module.exports = {
    name: 'trade',
    description: 'Command for setting trade value of assets you have traded! When you purchase or sell an asset, you should put the price you paid here.',
    args: true,
    usage: '<sell | buy> <numberOfAssets> <assetType> <money> <@customer>\n\n**Assets:**\n*Buildings:* AIRPORT, FOB, PORT, RADAR\n*Surface assets:* MBT, AFV, IFV, APC, SAM, SPAAG, SF\n*Aerospace assets:* L, M, H, LA, VL, VTOL, SAT, OV\n*Naval assets:* K, F, DD, CC, BC, BB, CL, CV\n**Weapons:**\n*Aerial:* SRAAM, MRAAM, LRAAM, AGM, ASHM, ATGM, SRSAM ,MRSAM, LRSAM, SEAD\n*Surface:* CRUISE, BALLISTIC, ABM, ASM\n*Bombs:* UNGUI, GUI, EW, RECON, FUEL, GUNPOD',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) {
        const nation = cfg.users[message.author.id].nation;
        const money = parseInt(args[3]);
        const unit = args[2].toUpperCase();
        const amount = parseInt(args[1]);
        let type;

        type = args[0].toLowerCase();

        if(!units.hasOwnProperty(unit)) {
            return message.channel.send('AssetType not found. Please retry.');
        } else if (isNaN(amount) || isNaN(money)) {
            return message.channel.send('Argument money or number of assets is not a number. Canceling operation.');
        } else if (!type.startsWith('sell') && !type.startsWith('buy')) {
            return message.channel.send('First argument is not sell or buy.');
        } else if (nation === undefined) {
            return message.channel.send('Nation does not exist in our database. Contact moderator or retry.');
        } else if (cfg.users[message.mentions.users.first().id].nation === undefined) {
            return message.channel.send(`No such user's nation exists.`);
        }

        type = !type.startsWith('buy');

        gm.findUnitPrice(unit, message, nation)
        .then(data => {
            if (data[0] === false) {
                data[0] = 0;
            } else if (data[0] * 4 * amount > money) {
                message.channel.send('The price of this trade is lower than production cost of the vehicles!');
                return;
            }
            gm.findVertical(cfg.users[message.mentions.users.first().id].nation, 'A', message)
            .then(customer => {
                let col = fn.toCoordinate(data[1]);
                    transfer(data[2], col, amount, money, message, type)
                    .then(() => {
                        transfer(customer, col, amount, money, message, !type)
                        .then(() => {
                            let msg = ` ${amount} ${unit}s for ${money.toLocaleString()+cfg.money} finished!`;
                            gm.report(message, `<@${message.author.id}> has traded with <@${message.mentions.users.first().id}>` + msg);
                            message.channel.send(`Transaction with ${message.mentions.users.first().username}` + msg);
                            
                        })
                        .catch(err => {
                            message.channel.send(err);
                        })
                    })
                    .catch(err => {
                        message.channel.send(err);
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
                    unitsAmount = amount - parseInt(unitsAmount);
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
                            .then(() => {
                                fn.ss(['set', `B${nationRow}`, balance], message).then(() => {
                                    resolve();
                                })

                            })
                            .catch(err => reject(err));
                    })
                    .catch(err => reject(err));
            })
            .catch(err => reject(err));
    })
}