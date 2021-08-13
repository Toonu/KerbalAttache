const {ping, messageHandler, log, embedSwitcher, resultOptions} = require("../utils"),
    cfg = require("./../config.json");
// noinspection JSUnusedLocalSymbols
module.exports = {
    name: 'state',
    description: 'Command for getting your current asset list! Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}state [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function state(message, args, db) {
        //Getting user.
        let discordUser = ping(message);
        let databaseUser;
    
        for (databaseUser of db.users) {
            if (databaseUser.isEqual(discordUser)) {
                break;
            }
        }
        
        if (!databaseUser) {
            return messageHandler(message, 'InvalidArgumentType: User is not defined', true);
        } else if (!databaseUser.state) {
            return messageHandler(message, 'InvalidArgumentType: User state is not defined', true);
        }
        
        let embeds = [databaseUser.state.toEmbed(db)].concat(databaseUser.state.assets.toEmbeds(databaseUser.state));

        //Embed options
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
    },
};