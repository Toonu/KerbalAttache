const {getCellArray} = require("../sheet"), {ping, messageHandler, log, embedSwitcher, resultOptions} = require("../utils"),
    cfg = require("./../config.json"), discord = require('discord.js');
// noinspection JSUnusedLocalSymbols
module.exports = {
    name: 'assets',
    description: 'Command for getting your current asset list! Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}assets [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function assets(message) {
        //Getting user.
        let user = ping(message).id;
        let nation = cfg.users[user].nation;

        //Making embeds.
        const embedAssets = createEmbed(nation, user);
        const embedSystems = createEmbed(nation, user);

        //Gathering data.
        let dataSystems = await getCellArray('A1', cfg.systemsCol, cfg.systems, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });
        let dataMain = await getCellArray('A1', cfg.mainCol, cfg.main, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        //Finding relevant data.
        let row = 0;
        let startMainCol = 0;
        let startSystemCol = 0;
        let technologyCol = 0;
        let systemsEndCol = 0;

        for (row; row < dataMain[0].length; row++) {
            if (dataMain[0][row] === nation) break;
        }
        for (technologyCol; technologyCol < dataMain.length; technologyCol++) {
            if (dataMain[technologyCol][cfg.mainAccountingRow] === 'Maintenance') startMainCol = technologyCol;
            else if (dataMain[technologyCol][cfg.mainRow] === 'Technology') break;
        }
        for (systemsEndCol; systemsEndCol < dataSystems.length; systemsEndCol++) {
            if (dataSystems[systemsEndCol][cfg.mainAccountingRow] === 'Systems') startSystemCol = systemsEndCol;
            else if (dataSystems[systemsEndCol][cfg.systemsRow] === '') break;
        }

        //Finishing embeds.
        for (let column = startMainCol; column < technologyCol; column++) {
            let item = dataMain[column][row];
            if (!Number.isNaN(item) && item !== 0) {
                embedAssets.addField(dataMain[column][cfg.mainRow], item, true);
            }
        }
        for (let column = startSystemCol; column < systemsEndCol; column++) {
            let item = dataSystems[column][row];
            if (!Number.isNaN(item) && item !== 0) {
                embedSystems.addField(dataSystems[column][cfg.systemsRow], item, true);
            }
        }

        //Embed options
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '➡️' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        // noinspection JSUnusedLocalSymbols
        function processReactions(reaction, embedMessage) {
            if (reaction.emoji.name === '➡️') {
                return resultOptions.moveNext;
            } else if (reaction.emoji.name === '❌') {
                return resultOptions.delete;
            }
        }
        await embedSwitcher(message, [embedAssets, embedSystems], ['❌', '➡️'], emojiFilter, processReactions)
            .then(() => message.delete().catch(error => log(error, true)))
            .catch(error => messageHandler(message, error, true));
    },
}

/**
 * Function creates embed header for a nation assets.
 * @private
 * @param {string} nation   nation name.
 * @param {string} user     user name.
 * @return {module:"discord.js".MessageEmbed} Returns embed message header.
 */
function createEmbed(nation, user) {
    return new discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`National Roster of ${nation}`)
        .setURL(cfg.users[user].map)
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .setFooter('Made by the Attachè to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');
}
