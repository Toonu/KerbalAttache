const cfg = require("./../config.json"), assets = require('../dataImports/assets.json'),
    {exportFile, messageHandler, report, formatCurrency, ping, log} = require("../utils");
const {Trade} = require('../dataStructures/Trade');
const {Asset} = require('../dataStructures/Asset');
const {System} = require('../dataStructures/System');
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
        //Showing list of open trades of an user, alternatively validating input arguments.
        if (!args[1])
            return showTrades(message, args, db);
        else if (!message.mentions.users.first())
            return messageHandler(message, new Error('InvalidArgumentException: No user was tagged, please retry.'), true);
        else if (args.length !== 5 || !args[0] || !args[2])
            return messageHandler(message, new Error('InvalidArgumentException: Not all arguments needed are present.'), true);
        else if (message.author.id === message.mentions.users.first().id) {
            return messageHandler(message, new Error('InvalidArgumentException: Author and recipient cannot be same'), true);
        }
        
        const discordAuthor = message.author;
        const discordRecipient = message.mentions.users.first();
        const money = parseInt(args[3]);
        const amount = parseInt(args[1]);
        let assetName = args[2].toUpperCase();
        let isSelling = args[0].toLowerCase();
        let author;
        let recipient;
        let asset;
    
        //Getting asset data.
        for (const [name, assetData] of Object.entries(assets.assets)) {
            if (name === assetName) {
                asset = new Asset(name, assetData.desc, assetData.theatre, assetData.cost);
                break;
            }
        }
        if (!asset) {
            for (const [name, assetData] of Object.entries(assets.systems)) {
                if (name === assetName) {
                    asset = new System(name, assetData.desc, assetData.cost);
                    break;
                }
            }
        }
    
        //Getting users from the database.
        for (const dbUser of db.users) {
            if (dbUser.isEqual(discordAuthor)) {
                author = dbUser;
            } else if (dbUser.isEqual(discordRecipient)) {
                recipient = dbUser;
            }
        }

        //Validating input arguments.
        if(!asset)
            return messageHandler(message, new Error('InvalidTypeException: AssetType not found. Please retry.'), true);
        else if (Number.isNaN(amount) || Number.isNaN(money))
            return messageHandler(message, new Error('InvalidTypeException: Argument money or number of assets is not ' +
                'a number. Canceling operation.'), true);
        else if (!isSelling.startsWith('sell') && !isSelling.startsWith('buy'))
            return messageHandler(message, new Error('InvalidArgumentException: First argument is not sell or buy.'), true);
        else if (!author || !recipient)
            return messageHandler(message, new Error('Nation does not exist in our database. Contact moderator or retry.'), true);
        else if (amount <= 0)
            return messageHandler(message, new Error('You cannot send just the assets kiddo.'), true);
        else if (asset.price > money)
            return messageHandler(message, new Error('The price of this trade is lower than production cost of the vehicles!'), true);
        
        let trade = new Trade(discordAuthor.id, discordRecipient.id, amount, money, asset, isSelling === 'sell');
        db.addTrade(trade);
        db.export();
        
        //DM of a trade to the recipient.
        message.mentions.users.first().send(`Transaction was proposed by ${message.author.username}! Information:
The proposer wants to *${isSelling ? 'sell' : "buy from"}* you \`${amount} ${asset.name}s\` for ***${formatCurrency(money)}***

To accept the transaction, type \`${cfg.prefix}accept\` in your server **state** channel.`)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        report(message, `${discordAuthor} has proposed to ${args[0].toLowerCase()} ${discordRecipient} ${trade.amount} ${args[2].toUpperCase()}s for ${formatCurrency(trade.money)}!`, this.name);
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

        if (Number.isNaN(id))
            messageHandler(message, new Error('InvalidTypeException: Trade ID is not a number!'), true);
        //Allows canceling or rejecting trade for both author and recipient.
        else if (trade && trade.author === message.author.id || trade.recipient === message.author.id) {
            let trade = db.removeTrade(id);
            db.export();
            
            messageHandler(message, `Trade with ID:${id} rejected!`, true);
            report(message, `Trade ID:${id} of user ${discordUser} rejected!`, 'reject');
            //DMing author.
            let authorUser = await client.users.fetch(trade.author)
            .catch(error => log(error, true));
            authorUser.send(`Your trade of ${trade.amount} ${trade.asset.name} rejected by the ${message.author} | ${db.getState(trade.recipient).name}!`)
            .catch(error => log(error, true));
        } else messageHandler(message, new Error('InvalidArgumentException: No trade with such ID exist!'), true);
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
        //let discordUser = message.author;
    
        let discordUser = ping(message);
        let trade = db.getTrade(id);

        //Validating input arguments.
        if (Number.isNaN(id))
            return messageHandler(message, new Error(`InvalidTypeException: ID is not a number!`), true);
        else if (!trade)
            return messageHandler(message, new Error(`InvalidArgumentException: Trade with ID:${id} does not exist!`), true);

        trade.finishTrade(db);
        db.remove(trade);
        db.export();

        report(message, `<@${trade.author.user.id}>'s transaction with ID:${id} of ${trade.amount} ${trade.asset.name}s for ${formatCurrency(trade.money)} was accepted by <@${discordUser}>!`, 'accept');
        messageHandler(message, 'Transaction was accepted and delivered!', true);
        //DMing author.
        let authorUser = await client.users.fetch(trade.author.user.id)
        .catch(error => log(error, true));
        authorUser.send(`Your trade of ${trade.amount} ${trade.asset.name} accepted by the ${message.author} | ${trade.author.state.name}!`)
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
    //When having clearance and ping user, use him.
    let discordUser = ping(message);
    
    db.trades.forEach(trade => {
        if (trade.author === discordUser.id) {
            newMessage += `Outgoing trade ID[${trade.id}] | ${trade.isSelling ? '+' : '-'}`
                +`${trade.amount.toString().padEnd(3)} ${trade.asset.name.padEnd(10)} for `
                +`${trade.isSelling ? '-' : '+'}${formatCurrency(trade.money)} for `
                +`${db.getState(trade.recipient).name} | ${db.getUser(trade.recipient).user.username} \n`;
        } else if (trade  === discordUser.id) {
            newMessage += `Incomming trade ID[${trade.id}] | ${trade.isSelling ? '+' : '-'}`
                +`${trade.amount.toString().padEnd(3)} ${trade.asset.name.padEnd(10)} for `
                +`${trade.isSelling ? '-' : '+'}${formatCurrency(trade.money)} from ${db.getState(trade.author).name} `
                +`| ${db.getUser(trade.author).user.username} \n`;
        }
    });

    message.channel.send(`Your open trade proposals:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
                .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
    return message.delete().catch(error => log(error, true));
}
