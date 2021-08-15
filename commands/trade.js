const cfg = require("./../config.json"),
    {messageHandler, report, formatCurrency, ping, log} = require("../utils");
const {Trade} = require('../dataStructures/Trade');
const {findAsset} = require('../sheet');
let client;

module.exports = {
    name: 'trade',
    description: 'Command for making trade transactions between nations. Note that you can have only one pending transaction at time!',
    args: 0,
    usage: `${cfg.prefix}trade [sell | buy] [AMOUNT] [ASSET] [PRICE] [USER]

Eg. ${cfg.prefix}trade sell 2 IFV 20000 @User
**Assets:** can be listed via empty **${cfg.prefix}buy** command.
**Trades:** can be listed via empty **${cfg.prefix}trade** command.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function trade(message, args, db) {
        //Validating input arguments.
        if (!args[1])
            //No arguments shows list of trades of the message author.
            return showTrades(message, args, db);
        else if (!message.mentions.users.first())
            return messageHandler(message, new Error('InvalidArgumentException: No user was tagged, please retry.'), true);
        else if (args.length !== 5 || !args[0] || !args[2])
            return messageHandler(message, new Error('InvalidArgumentException: Not all arguments needed are present.'), true);
        else if (message.author.id === message.mentions.users.first().id)
            return messageHandler(message, new Error('InvalidArgumentException: Author and recipient cannot be same'), true);
        
        //Parsing input arguments.
        const discordRecipient = message.mentions.users.first();
        const money = parseInt(args[3]);
        const amount = parseInt(args[1]);
        let isSelling = args[0].toLowerCase();
        let author;
        let recipient;
        let asset = findAsset(args[2]);
    
        //Getting users from the database.
        author = db.getUser(message.author);
        recipient = db.getUser(discordRecipient);

        //Validating parsed arguments.
        if(!asset)
            return messageHandler(message, new Error('InvalidTypeException: AssetType not found. Please retry.'), true);
        else if (Number.isNaN(amount) || Number.isNaN(money))
            return messageHandler(message, new Error('InvalidTypeException: Argument money or number of assets is not ' +
                'a number. Canceling operation.'), true);
        else if (!isSelling.startsWith('sell') && !isSelling.startsWith('buy'))
            return messageHandler(message, new Error('InvalidArgumentException: First argument is not sell or buy.'), true);
        else if (!author || !recipient)
            return messageHandler(message,
                new Error('User does not exist in our database. Contact moderator or retry.'), true);
        else if (!author.state || !recipient.state)
            return messageHandler(message,
                new Error('State of the user does not exist in our database. Contact moderator or retry.'), true);
        else if (amount <= 0)
            return messageHandler(message, new Error('You cannot send just the assets kiddo.'), true);
        else if (money < 0)
            return messageHandler(message, new Error('Good try. No negative amount trades.'), true);
        else if (asset.cost * amount > money)
            return messageHandler(message, new Error('The price of this trade is lower than production cost of the vehicles!'), true);
        else if (money > asset.cost * amount * 4)
            //Cheesy trade with overpriced units detection.
            report(message, `${message.author} has proposed a cheesy trade with more than 4x the price of the sold items!`, this.name);
        
        //Making new trade and exporting it.
        let trade = new Trade(message.author.id, discordRecipient.id, amount, money, asset, isSelling === 'sell');
        db.addTrade(trade);
        db.export();
        
        //DM of a trade to the recipient and reporting.
        message.mentions.users.first().send(`Transaction was proposed by ${message.author.username}! Information:
The proposer wants to *${isSelling ? 'sell' : "buy from"}* you \`${amount} ${asset.name}s\` for ***${formatCurrency(money)}***

To accept the transaction, type \`${cfg.prefix}accept\` in your server **state** channel.`)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        report(message, `${message.author} has proposed to ${args[0].toLowerCase()} ${discordRecipient} ${trade.amount} ${args[2].toUpperCase()}s for ${formatCurrency(trade.money)}!`, this.name);
        messageHandler(message, `Proposition of transaction with ${discordRecipient.username} [${recipient.state.name}] was delivered to the recipient!`, true);
    },

    /**
     * Function rejects trade proposal with specified ID and deletes it.
     * @param message           Message object.
     * @param {Array} args      args[0] contains number ID.
     * @param db
     */
    reject: async function reject(message, args, db) {
        let discordUser = ping(message);
        let id = parseInt(args[0]);
        let trade = db.getTrade(id);

        //Validating input arguments and trade ID.
        if (Number.isNaN(id)) {
            messageHandler(message, new Error('InvalidTypeException: Trade ID is not a number!'), true);
        } else if (trade && trade.author === discordUser.id || trade.recipient === discordUser.id) {
            //Allows canceling or rejecting trade for both author and recipient of the specified trade.
            db.removeTrade(id);
            db.export();
            
            //Reporting and DMing trade author about rejection.
            messageHandler(message, `Trade with ID:${id} rejected!`, true);
            report(message, `Trade ID:${id} of user ${discordUser} rejected!`, 'reject');

            let authorUser = await client.users.fetch(trade.author)
            .catch(error => log(error, true));
            authorUser.send(`Your trade of ${trade.amount} ${trade.asset.name} rejected by the ${message.author} for ${db.getState(trade.recipient).name} state!`)
            .catch(error => log(error, true));
        } else {
            messageHandler(message, new Error('InvalidArgumentException: No trade with such ID exist!'), true);
        }
    },

    /**
     * Function accepts trade proposal.
     * @param message               Message object.
     * @param {Array} args          Message args array.
     * @param db
     * @return {Promise<void>}      Returns nothing.
     */
    accept: async function accept(message, args, db) {
        let id = parseInt(args[0]);
        let trade = db.getTrade(id);

        //Validating input arguments.
        if (Number.isNaN(id))
            return messageHandler(message, new Error(`InvalidTypeException: ID is not a number!`), true);
        else if (!trade)
            return messageHandler(message, new Error(`InvalidArgumentException: Trade with ID:${id} does not exist!`), true);

        //Finishing trade and exporting.
        try {
            trade.finishTrade(db);
        } catch (error) {
            return messageHandler(message, error, true);
        }
        db.removeTrade(trade.id);
        db.export();
        //Reporting and DMing trade author about the acceptance.
        report(message, `<@${trade.author}>'s transaction with ID:${id} of ${trade.amount} ${trade.asset.name}s for ${formatCurrency(trade.money)} was accepted by ${message.author}!`, 'accept');
        messageHandler(message, 'Transaction was accepted and delivered!', true);
        //DMing author.
        let authorUser = await client.users.fetch(trade.author)
        .catch(error => log(error, true));
        authorUser.send(`Your trade of ${trade.amount} ${trade.asset.name} accepted by the ${message.author} | ${db.getState(trade.author).name}!`)
        .catch(error => log(error, true));
    },
    
    /**
     * Function sets client to cache users from it.
     * @param newClient Discord client.
     */
    setClient: function setClient(newClient) {
        client = newClient;
    }
};

/**
 * Function prints all available trades of the author or pinged user.
 * @param message               Message to analyse.
 * @param args
 * @param db
 * @return {Promise<any>|void}  Returns nothing.
 */
function showTrades(message, args, db) {
    let newMessage = '';
    //Using tagged user when having clearance and tagged user.
    let discordUser = ping(message);
    
    //Parsing trades data, both outgoing and incomming.
    db.trades.forEach(trade => {
        if (trade.author === discordUser.id || trade.recipient === discordUser.id) {
            // noinspection JSCheckFunctionSignatures, Trade object cast.
            newMessage += `${trade.toString(db)}\n`;
        }
    });

    //Printing if any trades were found.
    if (newMessage.length > 20) {
        message.channel.send(`Your open trade proposals:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
            .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
        return message.delete().catch(error => log(error, true));
    } else {
        messageHandler(message, 'NullReferenceException: No trades to show.', true);
    }
}
