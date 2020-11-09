const cfg = require("./../config.json"), gm = require("./../game"),
    units = require('./../units.json'), {get, set} = require("../sheet");
module.exports = {
    name: 'trade',
    description: 'Command for setting trade value of assets you have traded! When you purchase or sell an asset, you should put the price you paid here.',
    args: true,
    usage: '[sell | buy] [numberOfAssets] [assetType] [money] [@customer]\n\n**Assets:**\n*Buildings:* AIRPORT, FOB, PORT, RADAR\n*Surface assets:* MBT, AFV, IFV, APC, SAM, SPAAG, SF\n*Aerospace assets:* L, M, H, LA, VL, VTOL, SAT, OV\n*Naval assets:* K, F, DD, CC, BC, BB, CL, CV\n**Weapons:**\n*Aerial:* SRAAM, MRAAM, LRAAM, AGM, ASHM, ATGM, SRSAM ,MRSAM, LRSAM, SEAD\n*Surface:* CRUISE, BALLISTIC, ABM, ASM\n*Bombs:* UNGUI, GUI, EW, RECON, FUEL, GUNPOD',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) {
        const nation = cfg.users[message.author.id].nation;
        const customer = cfg.users[message.mentions.users.first().id].nation;
        const money = parseInt(args[3]);
        const unit = args[2].toUpperCase();
        const amount = parseInt(args[1]);
        let type = args[0].toLowerCase();
        let tab = undefined;

        if(!units.hasOwnProperty(unit)) {
            message.channel.send('AssetType not found. Please retry.').then(msg => msg.delete({timeout: 5000}));
            return message.delete();
        } else if (isNaN(amount) || isNaN(money)) {
            message.channel.send('Argument money or number of assets is not a number. Canceling operation.')
                .then(msg => msg.delete({timeout: 5000}));
            return message.delete();
        } else if (!type.startsWith('sell') && !type.startsWith('buy')) {
            message.channel.send('First argument is not sell or buy.').then(msg => msg.delete({timeout: 5000}));
            return message.delete();
        } else if (nation === undefined || customer === undefined) {
            message.channel.send('Nation does not exist in our database. Contact moderator or retry.')
                .then(msg => msg.delete({timeout: 5000}));
            return message.delete();
        }

        type = !type.startsWith('buy');
        if (['wpSurface', 'wpAerial', 'systems'].includes(units[unit][1])) {
            tab = 'Stockpiles';
        }
        message.delete();
        gm.findData(unit, nation)
        .then(data => {
            if (data[0] * 4 * amount > money) {
                return message.channel.send('The price of this trade is lower than production cost of the vehicles!')
                    .then(msg => msg.delete({timeout: 10000}));
            }
            gm.findVertical(customer, 'A')
            .then(customerRow => {
                transfer(data[2], data[1], amount, money, message, type, tab)
                .then(() => {
                    transfer(customerRow, data[1], amount, money, message, !type, tab)
                    .then(() => {
                        gm.report(message, `<@${message.author.id}> has traded ${amount} ${unit}s for 
                        ${money.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })} with <@${message.mentions.users.first().id}>!`, this.name);
                        message.channel.send(`Transaction with ${message.mentions.users.first().username} finished and assets delivered!`)
                            .then(msg => msg.delete({timeout: 10000}));
                    })
                    .catch(err => {
                        message.channel.send(err).then(msg => msg.delete({timeout: 10000}));
                    })
                })
                .catch(err => {
                    message.channel.send(err).then(msg => msg.delete({timeout: 10000}));
                })
            })
            .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
    },
};

function transfer(nationRow, unitCol, amount, money, message, type, tab) {
    return new Promise(function (resolve, reject) {
        get(`${unitCol + nationRow}`, tab)
            .then(unitsAmount => {
                if (type) {
                    unitsAmount = parseInt(unitsAmount) - amount;
                } else {
                    unitsAmount = parseInt(unitsAmount) + amount;
                }
                if(unitsAmount < 0) {
                    reject('Not enough units to sell!');
                    return;
                }
                get(`B${nationRow}`, tab)
                    .then(balance => {
                        if (type) {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) + money;
                        } else {
                            balance = parseInt(balance.replace(/[,|$]/g, '')) - money;
                        }
                        set( `${unitCol + nationRow}`, unitsAmount, tab)
                            .then(() => {
                                set(`B${nationRow}`, balance, tab).then(() => {
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