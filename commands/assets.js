const {getCellArray} = require("../sheet"), {findVertical} = require("../game"), {ping, messageHandler} = require("../utils"),
    cfg = require("./../config.json"), discord = require('discord.js');
module.exports = {
    name: 'assets',
    description: 'Command for getting your current asset list! Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}assets [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function assets(message) {
        let user = ping(message).id;
        let nation = cfg.users[user].nation;

        const embedAssets = createEmbed(nation, user);
        const embedSystems = createEmbed(nation, user);

        let dataSystems = await getCellArray('A1', cfg.systemsCol, cfg.systems, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });
        let dataMain = await getCellArray('A1', cfg.mainCol, cfg.main, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        let row = 0;
        for (row; row < dataMain[0].length; row++) {
            if (dataMain[0][row] === nation) break;
        }

        for (const systemColumn of dataSystems) {
            if (!Number.isNaN(systemColumn[row])) {
                embedSystems.addField(systemColumn[cfg.systemsRow], systemColumn[row], true);
            }
        }
        for (const assetColumn of dataMain) {
            if (!Number.isNaN(assetColumn[row])) {
                embedAssets.addField(assetColumn[cfg.systemsRow], assetColumn[row], true);
            }
        }

        await embedSwitcher(message, [embedAssets, embedSystems]);
        message.delete();
    }    
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

async function embedSwitcher(embed, message) {
    return new Promise(function (resolve, reject) {
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '➡️' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        while (true) {

        }

        message.channel.send(embed).then(msg => {
            msg.react('❌').catch(error => console.error(error));
            msg.react('➡️').catch(error => console.error(error));
            msg.awaitReactions(emojiFilter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    let react = collected.first();
                    if (react.emoji.name === '➡️') {
                        resolve([true,msg]);
                    } else if (react.emoji.name === '❌') {
                        msg.delete();
                        resolve([false,msg]);
                    }
                })
                .catch(() => msg.delete())
        })
        .catch(() => resolve([false]));
    })
}