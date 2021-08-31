const {messageHandler, report, formatCurrency, ping, log, embedSwitcher, processYesNo, resultOptions} = require("../utils");
const {prefix} = require('../database.json');
const {Loan} = require('../dataStructures/Loan');
const discord = require('discord.js');

module.exports = {
    name: 'loan',
    description: 'Command for making loans between nations.',
    args: 0,
    usage: `${prefix}loan [AMOUNT] [INTEREST] [TIME] [USER]

Eg. ${prefix}loan 20000 4 5 @User
for a loan of 20 000 at 4% interest and 5 turns long.

WARNING: You cannot cancel a loan manually, only moderators can. Do not enter loans that are not arranged with the recipient diplomatically beforehand! Penalties for misuse present.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function loan(message, args, db) {
        //Validating input arguments.
            if (!args[1])
            //No arguments shows list of trades of the message author.
            return showLoans(message, args, db);
        else if (!message.mentions.users.first())
            return messageHandler(message, new Error('InvalidArgumentException: No user was tagged, please retry.'), true);
        else if (args.length !== 4)
            return messageHandler(message, new Error('InvalidArgumentException: Not all arguments needed are present.'), true);
        else if (message.author.id === message.mentions.users.first().id)
            return messageHandler(message, new Error('InvalidArgumentException: Author and recipient cannot be same'), true);
        
        //Parsing input arguments.
        const discordRecipient = message.mentions.users.first();
        const amount = parseInt(args[0]);
        const interest = parseInt(args[1]);
        const turns = parseInt(args[2]);
        let author = db.getUser(message.author);
        let recipient = db.getUser(discordRecipient);

        //Validating parsed arguments.
        if (Number.isNaN(amount) || Number.isNaN(interest) || Number.isNaN(turns))
            return messageHandler(message, new Error('InvalidTypeException: Argument money or interest is not ' +
                'a number. Canceling operation.'), true);
        else if (!author || !recipient)
            return messageHandler(message,
                new Error('User does not exist in our database. Contact moderator or retry.'), true);
        else if (!author.state || !recipient.state)
            return messageHandler(message,
                new Error('State of the user does not exist in our database. Contact moderator or retry.'), true);
        else if (amount <= 0 || interest <= 0)
            return messageHandler(message, new Error('You cannot send nothing.'), true);
        
        //Making new trade and exporting it.
        let loan = new Loan(author.user.id, recipient.user.id, amount, interest, turns);
        let embed = new discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`Loan towards the ${recipient.state.name}`)
        .setURL('https://discord.js.org/') //URL clickable from the title
        .setThumbnail('https://imgur.com/YGlmh22.png')
        .addField('Amount:', `${formatCurrency(amount)}`)
        .addField('Interest:', `${interest}%`, true)
        .addField('Length:', `${turns} turns`, true)
        .addField('Turn payment:', `${formatCurrency(loan.payment)}`, true)
        .addField('Buy?', 'Press ✅')
        .setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');

        function filterYesNo(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }
    
        return await embedSwitcher(message, [embed], ['✅', '❌'], filterYesNo, processYesNo)
        .then(result => {
            if (result === resultOptions.confirm) {
                db.loans.push(loan);
                db.export();
    
                //DM of a trade to the recipient and reporting.
                message.mentions.users.first().send(`Loan was sent by the ${message.author.username}! Information:
${formatCurrency(amount)} at a ${interest}% interest for ${turns} turns.\nIf you have not approved the loan transaction beforehand with the recipient, contact a moderator immidiately.`)
                .catch(error => {
                    return messageHandler(message, error, true);
                });
    
                report(message, `${message.author} has proposed to loan ${discordRecipient} ${formatCurrency(amount)} at a ${interest}% interest for ${turns} turns: ${formatCurrency(loan.payment)}`, this.name);
                messageHandler(message, `Proposition of transaction with ${discordRecipient.username} [${recipient.state.name}] was delivered to the recipient!`, true);
            } else {
                messageHandler(message, 'Loan creation canceled.', true);
            }
        })
        .catch(error => messageHandler(message, error, true));
    }
};

/**
 * Function prints all available trades of the author or pinged user.
 * @param message               Message to analyse.
 * @param args
 * @param db
 * @return {Promise<any>|void}  Returns nothing.
 */
function showLoans(message, args, db) {
    let newMessage = '';
    //Using tagged user when having clearance and tagged user.
    let discordUser = ping(message);
    
    //Parsing trades data, both outgoing and incomming.
    db.loans.forEach(loan => {
        if (loan.debtor === discordUser.id || loan.creditor === discordUser.id) {
            // noinspection JSCheckFunctionSignatures, Trade object cast.
            newMessage += `${loan.toString(db)}\n`;
        }
    });

    //Printing if any trades were found.
    if (newMessage.length > 20) {
        message.channel.send(`Your loans:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
            .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
        return message.delete().catch(error => log(error, true));
    } else {
        messageHandler(message, 'NullReferenceException: No loans to show.', true);
    }
}
