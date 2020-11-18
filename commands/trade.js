const cfg = require("./../config.json"), gm = require("./../game"), units = require('./../units.json');
const {exportFile} = require("../jsonManagement");
module.exports = {
    name: 'trade',
    description: 'Command for making trade transactions between nations. Note that you can have only one pending transaction at time!',
    args: true,
    usage: `[sell | buy] [numberOfAssets] [assetType] [money] [@customer]

**Assets:** can be listed via **?buy** command.`,
    cooldown: 5,
    guildOnly: false,
    execute: async function trade(message, args) {
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
        gm.findData(unit, nation, false, tab)
        .then(data => {
            if (data[0] * 4 * amount > money) {
                return message.channel.send('The price of this trade is lower than production cost of the vehicles!')
                    .then(msg => msg.delete({timeout: 10000}));
            }


            gm.report(message, `<@${message.author.id}> has proposed to ${args[0].toLowerCase()} ${amount} ${unit}s for ${money.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })} with <@${message.mentions.users.first().id}>!`, this.name);
            message.channel.send(`Transaction with ${message.mentions.users.first().username} was proposed to recipient and delivered!`)
                .then(msg => msg.delete({timeout: 10000}));
            message.mentions.users.first().send(`Transaction was proposed by ${message.author.username}! Information:
He ${args[0].toLowerCase()} ${amount} ${unit}s to you for ***${money.toLocaleString('fr-FR', {style: 'currency', currency: cfg.money})}***

To accept the transaction, type ?accept in your server channel.`);

            cfg.trade[message.mentions.users.first().id] = {
                "nation": nation,
                "amount": amount,
                "money": money,
                "unit": unit,
                "type": type,
                "tab": tab,
                "transaction": args[0].toLowerCase(),
                "nationRow": data[2],
                "unitCol": data[1],
                "message": message
            }
            exportFile('config.json', cfg);
        })
        .catch(err => console.error(err));
    },
};
