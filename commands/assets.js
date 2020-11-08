const {findVertical} = require("../game"), {ss} = require("../fn"), {ping} = require("../jsonManagement");
module.exports = {
    name: 'assets',
    description: 'Command for getting your current assets! Do NOT use in public channels.',
    args: false,
    usage: '<M:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require('./../config.json')
        const discord = require('discord.js');

        let user = ping(message).id;
        let nation = cfg.users[user].nation;

        const embed = new discord.MessageEmbed()
            .setColor('#065535')
            .setTitle(`National Roster of ${nation}`)
            .setURL(`https://docs.google.com/spreadsheets/d/${cfg.users[user].sheet}/edit#gid=0`)
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attaché to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');

        const embedW = new discord.MessageEmbed()
            .setColor('#065535')
            .setTitle(`National Roster of ${nation}`)
            .setURL(`https://docs.google.com/spreadsheets/d/${cfg.users[user].sheet}/edit#gid=0`)
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attaché to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');


        //Units setup
        await findVertical(nation, 'A', message).then(nationRow => {
            ss(['getA', 'A4', `BA${nationRow}`], message).then(array => {
                for (let i = 4; i < array[array.length - 1].length; i++) {
                    if (array[0][i] === 'Technology') {
                        break;
                    } else if (array[array.length - 1][i] !== '.') {
                        embed.addField(array[0][i], array[array.length - 1][i], true);
                    }
                }
            }).catch(err => console.error(err));
        }).catch(err => console.error(err));
        //Weapons setup
        await findVertical(nation, 'A', message, 'Stockpiles').then(nationRow => {
            ss(['getA', 'A4', `AZ${nationRow}`], message, 'Stockpiles').then(array => {
                for (let i = 1; i < array[0].length; i++) {
                    if (array[0][i] === 'E') {
                        break;
                    } else if (array[array.length - 1][i] !== '.') {
                        embedW.addField(array[0][i], array[array.length - 1][i], true);
                    }
                }
            }).catch(err => console.error(err));
        }).catch(err => console.error(err));

        message.delete();
        //Embed switching mechanism
        let currentEmbed = embed;
        let switchEmbeds = await embUnits(currentEmbed, message);
        //Prints first embed, if its switched, returns Array with true,embed msg.
        // Then switches to the other embed, then deletes the old and prints new. Then loop again.
        while(switchEmbeds[0]) {
            currentEmbed = currentEmbed === embed ? embedW : embed;
            switchEmbeds[1].delete();
            switchEmbeds = await embUnits(currentEmbed, message);
        }
    }    
}

function embUnits(embed, message) {
    return new Promise(function (resolve) {
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '➡️' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        message.channel.send(embed)
            .then(msg => {
                msg.react('❌');
                msg.react('➡️');
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
                    .catch(() => {
                        msg.delete();
                    })
            })
            .catch(() => {
                resolve([false]);
            })
    })
}