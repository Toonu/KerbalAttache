const cfg = require("./../config.json"), units = require('./../units.json'),
    {exportFile, messageHandler, report, formatCurrency} = require("../utils"), {getCellArray} = require("../sheet");
module.exports = {
    name: 'trade',
    description: 'Command for making trade transactions between nations. Note that you can have only one pending transaction at time!',
    args: 5,
    usage: `${cfg.prefix}trade [sell | buy] [AMOUNT] [ASSET] [PRICE] [USER]

Eg. ${cfg.prefix}trade sell 2 IFV 20000 @User
**Assets:** can be listed via **${cfg.prefix}buy** command.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function trade(message, args) {
        const author = cfg.users[message.author.id].nation;
        const recipient = cfg.users[message.mentions.users.first().id].nation;
        const money = parseInt(args[3]);
        const amount = parseInt(args[1]);
        let unit = args[2].toUpperCase();
        let isSelling = args[0].toLowerCase();
        let tab = cfg.main;
        let tabEnd = cfg.mainCol;
        let authorRow = 0;
        let recipientRow = 0;
        let assetColumn = 0;

        //Checking for input errors.
        if(!units.units.hasOwnProperty(unit)) return messageHandler(message, new Error('InvalidTypeException: AssetType not found. Please retry.'), true);
        else if (isNaN(amount) || isNaN(money)) return messageHandler(message, new Error('InvalidTypeException: Argument money or number of assets is not a number. Canceling operation.'), true);
        else if (!isSelling.startsWith('sell') && !isSelling.startsWith('buy')) return messageHandler(message, new Error('InvalidArgumentException: First argument is not sell or buy.'), true);
        else if (author === undefined || recipient === undefined) return messageHandler(message, new Error('Nation does not exist in our database. Contact moderator or retry.'), true);
        else if (amount === 0) return messageHandler(message, new Error('You cannot send just the money kiddo.'), true);

        isSelling = !isSelling.startsWith('buy');
        if (['wpSurface', 'wpAerial', 'systems'].includes(units.units[unit][1])) {
            tab = cfg.systems;
            tabEnd = cfg.mainCol;
        }

        unit = units.units[unit];
        let data = await getCellArray('A1', tabEnd, tab, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        for (let i = 0; i < data.length; i++) {
            if (data[0][i] === author) authorRow = i;
            else if (data[0][i] === recipient) recipientRow = i;
        }
        for (assetColumn; assetColumn < data.length; assetColumn++) {
            if (args[2].toUpperCase() === data[assetColumn][cfg.mainRow]) break;
        }

        //last check before transaction
        if (unit.price > money) return messageHandler(message, new Error('The price of this trade is lower than production cost of the vehicles!'), true);
        else if (isSelling && data[assetColumn][authorRow] < amount) return messageHandler(message, new Error('You do not have enough vehicles to sell!'), true);
        else if (!recipientRow || !authorRow || assetColumn) return messageHandler(message, new Error('Could not find author or "recipient"!'), true);

        await message.mentions.users.first().send(`Transaction was proposed by ${message.author.username}! Information:
The proposer wants to ${isSelling ? 'sell' : "buy from"} you ${amount} ${args[2].toUpperCase()}s for ***${formatCurrency(money)}***

To accept the transaction, type ${cfg.prefix}accept in your server channel.`)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        cfg.trade[message.mentions.users.first().id] = {
            "author": author,
            "authorRow": authorRow,
            "recipient": recipient,
            "recipientRow": recipientRow,
            "amount": amount,
            "money": money,
            "unit": unit,
            "unitCol": assetColumn,
            "isSelling": isSelling,
            "tab": tab,
            "tabEnd": tabEnd,
            "transaction": args[0].toLowerCase(),
            "message": message
        }
        exportFile('config.json', cfg);

        report(message, `<@${message.author.id}> has proposed to ${args[0].toLowerCase()} <@${message.mentions.users.first().id}> ${amount} ${args[2].toUpperCase()}s for ${formatCurrency(money)}!`, this.name);
        messageHandler(message, `Proposition of transaction with ${message.mentions.users.first().username} was delivered to the recipient!`, true);
    },
};
