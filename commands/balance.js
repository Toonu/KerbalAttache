const {ping} = require("../jsonManagement"), {findVertical} = require("../game"), cfg = require('./../config.json'),
    discord = require('discord.js'), {getArray} = require("../sheet");
module.exports = {
    name: 'balance',
    description: 'Command for getting your current state statistics! Do NOT use in public channels.',
    args: false,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: function balance(message) {
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        let nation = cfg.users[ping(message).id].nation;

        findVertical('Data', 'A').then(dataRow => {
            getArray('A4', `AZ${dataRow - 1}`).then(array => {
                //Backup values by default.
                let rpCol = 36;
                let tilesCol = 39;
                for (let i = 4; i < array.length; i++) {
                    if (array[i] === 'RP') {
                        rpCol = i;
                    }
                    if (array[i] === 'Tiles') {
                        tilesCol = i;
                    }
                }

                array.forEach(element => {
                    if (element[0].startsWith(nation)) {
                        // noinspection JSCheckFunctionSignatures
                        const embed = new discord.MessageEmbed()
                        .setColor('#e0b319')
                        .setTitle(`National Bank of ${nation}`)
                        .setURL('https://discord.js.org/') //URL clickable from the title
                        .setThumbnail('https://imgur.com/IvUHO31.png')
                        .addFields(
                            { name: 'Nation:', value: nation},
                            { name: 'Account:', value: parseInt(element[1].replace(/[,|$]/g, '')).toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })},
                            { name: 'Balance:', value: parseInt(element[2].replace(/[,|$]/g, '')).toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })},
                            { name: 'Research budget:', value: parseInt(element[rpCol+1].replace(/[,|$]/g, '')).toLocaleString('fr-FR', { style: 'currency', currency: cfg.money }), inline: true},
                            { name: 'Research points:', value: `${parseInt(element[rpCol])}RP`, inline: true},
                            { name: 'Tiles:', value: parseInt(element[tilesCol])},
                        )
                        .setFooter('Made by the Attaché to the United Nations\nThis message will be auto-destructed in 32 seconds!', 'https://imgur.com/KLLkY2J.png');

                        message.channel.send(embed)
                        .then(msg => {
                            msg.react('❌').catch(err => console.log(err));
                            msg.awaitReactions(emojiFilter, { max: 1, time: 32000, errors: ['time']})
                                .then(collected => {
                                    let react = collected.first();
                                    if (react.emoji.name === '❌') {
                                        msg.delete();
                                    }
                                })
                                .catch(() => {
                                    msg.delete();
                                });
                        }).catch(err => console.log(err));
                    }
                })
            }).catch(err => console.log(err));
        }).catch(err => console.log(err));
        //Cleaning original message.
        message.delete();
    }
}
