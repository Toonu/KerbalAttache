const cfg = require("./../config.json"), units = require('./../units.json'),
    {exportFile, messageHandler, report, formatCurrency, ping, log} = require("../utils"),
    {getCellArray, setCellArray, toColumn} = require("./../sheet");

module.exports = {
    name: 'trade',
    description: 'Command for making trade transactions between nations. Note that you can have only one pending transaction at time!',
    args: 0,
    usage: `${cfg.prefix}trade [sell | buy] [AMOUNT] [ASSET] [PRICE] [USER]

Eg. ${cfg.prefix}trade sell 2 IFV 20000 @User
**Assets:** can be listed via empty **${cfg.prefix}buy** command.
**Trades:** can be listed via empty **${cfg.prefix}trade** [USER] command.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function trade(message, args) {
        const authorID = message.author.id;
        const cfgAuthor = cfg.users[authorID];

        //Showing list of open trades of an user.
        if (!args[1] && message.mentions.users.size !== 0) return showTrades(message);
        else if (!message.mentions.users.first().id) return messageHandler(message, new Error('InvalidArgumentException: No user was tagged, please retry.'));

        const recipientID = message.mentions.users.first().id;
        const cfgRecipient = cfg.users[recipientID];
        const money = parseInt(args[3]);
        const amount = parseInt(args[1]);
        let asset = args[2].toUpperCase();
        let isSelling = args[0].toLowerCase();
        let tab = cfg.main;
        let tabEnd = cfg.mainEndCol;
        let authorRow = 0;
        let recipientRow = 0;
        let assetColumn = 0;
        let accountColumn = 0;

        //Checking for input errors.
        if(!units.units.hasOwnProperty(asset)) return messageHandler(message, new Error('InvalidTypeException: AssetType not found. Please retry.'), true);
        else if (isNaN(amount) || isNaN(money)) return messageHandler(message, new Error('InvalidTypeException: Argument money or number of assets is not a` number. Canceling operation.'), true);
        else if (!isSelling.startsWith('sell') && !isSelling.startsWith('buy')) return messageHandler(message, new Error('InvalidArgumentException: First argument is not sell or buy.'), true);
        else if (cfgAuthor === undefined || cfgRecipient === undefined) return messageHandler(message, new Error('Nation does not exist in our database. Contact moderator or retry.'), true);
        else if (!amount) return messageHandler(message, new Error('You cannot send just the assets kiddo.'), true);

        isSelling = !isSelling.startsWith('buy');
        if (['wpSurface', 'wpAerial', 'systems'].includes(units.units[asset][1])) {
            tab = cfg.systems;
            tabEnd = cfg.systemsEndCol;
        }

        asset = units.units[asset];
        let data = await getCellArray('A1', tabEnd, tab, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        for (let i = 0; i < data.length; i++) {
            if (data[0][i] === cfgAuthor.nation) authorRow = i;
            else if (data[0][i] === cfgRecipient.nation) recipientRow = i;
        }
        for (assetColumn; assetColumn < data.length; assetColumn++) {
            if ('Account' === data[assetColumn][cfg.mainAccountingRow]) accountColumn = assetColumn;
            if (asset.name === data[assetColumn][cfg.mainRow]) break;
        }

        //last check before transaction
        if (asset.price > money) return messageHandler(message, new Error('The price of this trade is lower than production cost of the vehicles!'), true);
        else if (!recipientRow || !authorRow) return messageHandler(message, new Error('Could not find author or "recipient"!'), true);
        else if (!accountColumn || !assetColumn) return messageHandler(message, new Error('Could not find one of the columns!'), true);

        //await message.mentions.users.first().send
        await message.author.send(`Transaction was proposed by ${message.author.username}! Information:
The proposer wants to *${isSelling ? 'sell' : "buy from"}* you \`${amount} ${asset.name}s\` for ***${formatCurrency(money)}***

To accept the transaction, type \`${cfg.prefix}accept\` in your server **state** channel.`)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        //Getting new trade ID.
        let maxID = 1;
        if (cfgRecipient.trades[1]) {
            maxID += Object.keys(cfgRecipient.trades).length;
        }

        cfg.users[recipientID].trades[maxID] = {
            "authorID": authorID,
            "authorRow": authorRow,
            "recipientID": recipientID,
            "recipientRow": recipientRow,
            "amount": amount,
            "money": money,
            "asset": asset,
            "assetColumn": assetColumn,
            "isSelling": isSelling,
            "tab": tab
        };
        exportFile('config.json', cfg);

        report(message, `<@${authorID}> has proposed to ${args[0].toLowerCase()} <@${recipientID}> ${amount} ${args[2].toUpperCase()}s for ${formatCurrency(money)}!`, this.name);
        messageHandler(message, `Proposition of transaction with ${cfgRecipient.nation} [${cfgRecipient.name}] was delivered to the recipient!`, true);
    },

    /**
     * Function rejects trade proposal with specified ID and deletes it.
     * @param message           Message object.
     * @param {Array} args      args[0] contains number ID.
     */
    reject: function reject(message, args) {
        let user = ping(message).id;

        let tradeData = cfg.users[user].trades;
        let id = parseInt(args[0]);

        if (!tradeData) messageHandler(message, new Error('InvalidArgumentException: No trade exists and therefore none can be rejected.'), true);
        else if (!Number.isNaN(id) && tradeData[id]) {
            messageHandler(message, `Trade with ID:${id} rejected!`, true);
            report(message, `Trade ID:${id} of user <@${user}> rejected!`)
            delete tradeData[id];
            exportFile('config.json', cfg);
        } else messageHandler(message, new Error('No trade with such ID exist!'), true);
    },

    /**
     * Function accepts trade proposal.
     * @param message               Message object.
     * @param {Array} args          Message args array.
     * @return {Promise<void>}      Returns nothing.
     */
    accept: async function accept(message, args) {
        let id = parseInt(args[0]);
        let recipientID = message.author.id;
        let isErroneous = false;
        if (Object.keys(recipientID).length === 0) return messageHandler(message, new Error('InvalidArgumentException: No trade exists.'), true);
        if (Number.isNaN(id)) return messageHandler(message, new Error(`InvalidTypeException: ID is not a number!`), true);

        let tradeData = cfg.users[recipientID].trades[id];
        if (!tradeData) return messageHandler(message, new Error(`InvalidArgumentException: Trade with ID:${id} does not exist!`), true);

        let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        if (isErroneous) return;
        let systemData;
        let accountColumn = 0;

        for (accountColumn; accountColumn < data.length; accountColumn++) {
            if (data[accountColumn][cfg.mainAccountingRow] === 'Account') break;
        }

        if (tradeData.tab === cfg.systems) {
            systemData = await getCellArray('A1', cfg.systemsEndCol, cfg.systems, true)
                .catch(error => {
                    isErroneous = true;
                    return messageHandler(message, error, true);
                });
        }

        if (isErroneous) return;

        //isSelling true marks that the trade author gets his assets removed while the recipient pays money to him.
        if (data[0][tradeData.authorRow] !== cfg.users[tradeData.authorID].nation || data[0][tradeData.recipientRow] !== cfg.users[tradeData.recipientID].nation || tradeData.recipientID !== message.author.id) return messageHandler(message, new Error(`One of the trade sides encountered an error!`), true);
        else if (tradeData.isSelling && data[accountColumn][tradeData.isSelling ? tradeData.recipientRow : tradeData.authorRow] < tradeData.money) return messageHandler(message, new Error(`You do not have enough money to ${tradeData.isSelling ? 'buy' : 'sell'}!`), true);
        else if (tradeData.isSelling && tradeData.tab === cfg.systems ? systemData[tradeData.assetColumn][tradeData.authorRow] : data[tradeData.assetColumn][tradeData.authorRow] < tradeData.amount) return messageHandler(message, new Error(`You do not have enough vehicles to ${tradeData.isSelling ? 'sell' : 'buy'}!`), true);

        //Transfer the money and assets between the two sides.
        data[accountColumn][tradeData.isSelling ? tradeData.recipientRow : tradeData.authorRow] -= tradeData.money;
        data[accountColumn][tradeData.isSelling ? tradeData.authorRow : tradeData.recipientRow] += tradeData.money;
        (tradeData.tab === cfg.systems ? systemData : data)[tradeData.assetColumn][tradeData.isSelling ? tradeData.authorRow : tradeData.recipientRow] -= tradeData.amount;
        (tradeData.tab === cfg.systems ? systemData : data)[tradeData.assetColumn][tradeData.isSelling ? tradeData.recipientRow : tradeData.authorRow] += tradeData.amount;

        await setCellArray(toColumn(accountColumn) + '1', [data[accountColumn]], cfg.main, true).catch(error => {
            log(error, true);
            isErroneous = true;
            return messageHandler(message, new Error('Error has occurred.'), true);
        });
        await setCellArray(toColumn(tradeData.assetColumn) + '1', [tradeData.tab === cfg.systems ? systemData[tradeData.assetColumn] : data[tradeData.assetColumn]], tradeData.tab, true).catch(error => {
            log(error, true);
            isErroneous = true;
            return messageHandler(message, new Error('Error has occurred.'), true);
        });

        if (isErroneous) return;

        report(message, `<@${tradeData.authorID}>'s transaction with ID:${id} of ${tradeData.amount} ${tradeData.asset.name}s for ${formatCurrency(tradeData.money)} was accepted by <@${recipientID}>!`, 'accept');
        messageHandler(message, 'Transaction was accepted and delivered!', true);
        delete cfg.users[recipientID].trades[id];
        exportFile('config.json', cfg);
    },
};

/**
 * Function prints all available trades of the author or pinged user.
 * @param message               Message to analyse.
 * @return {Promise<any>|void}  Returns nothing.
 */
function showTrades(message) {
    let newMessage = '';

    let user = ping(message).id;

    if (!cfg.users[user]) return messageHandler(message, new Error('InvalidArgumentException: No trade exists. Canceling operation'), true);
    Object.entries(cfg.users[user].trades).forEach((trade) => {
        newMessage += `Trade [${trade[0]}] | ${trade[1].isSelling ? '+' : '-'}${trade[1].amount.toString().padEnd(3)} ${trade[1].asset.name.padEnd(10)} for ${trade[1].isSelling ? '-' : '+'}${formatCurrency(trade[1].money)}\n`;
    });

    message.channel.send(`Your open trade proposals:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
                .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
    return message.delete().catch(error => log(error, true));
}