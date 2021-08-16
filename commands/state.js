const {ping, messageHandler, log, embedSwitcher, resultOptions} = require("../utils");
const {prefix} = require('../database.json');

// noinspection JSUnusedLocalSymbols
module.exports = {
    name: 'state',
    description: 'Command for getting your current state information. Do NOT use in public channels.',
    args: 0,
    usage: `${prefix}state [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function state(message, args, db) {
        //Getting user.
        let discordUser = ping(message);
        let dbUser = db.getUser(discordUser);
        
        //Validating user.
        if (!dbUser) {
            return messageHandler(message, 'InvalidArgumentType: User is not defined', true);
        } else if (!dbUser.state) {
            return messageHandler(message, 'NullReferenceException: User state is not defined', true);
        }
        
        //Getting state embeds.
        let embeds = [dbUser.state.toEmbed(db)].concat(dbUser.state.assets.toEmbeds(dbUser.state));
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '➡️' || reaction.emoji.name === '❌' || reaction.emoji.name === '⬅️') && user.id === message.author.id;
        }
        // noinspection JSUnusedLocalSymbols
        function processReactions(reaction) {
            if (reaction.emoji.name === '➡️') {
                return resultOptions.moveRight;
            } else if (reaction.emoji.name === '❌') {
                return resultOptions.delete;
            } else if (reaction.emoji.name === '⬅️') {
                return resultOptions.moveLeft;
            }
        }
        await embedSwitcher(message, embeds, ['⬅️', '❌', '➡️'], emojiFilter, processReactions)
            .then(() => message.delete().catch(error => log(error, true)))
            .catch(error => messageHandler(message, error, true));
    }
};