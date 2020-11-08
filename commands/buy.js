const cfg = require('./../config.json'), units = require('./../units.json'),
    discord = require('discord.js'), {report, findUnitPrice} = require("../game"), {ss, toCoordinate} = require("../fn");
module.exports = {
    name: 'buy',
    description: 'Command for buying new assets and systems! Do NOT use in public channels.',
    args: false,
    usage: '[amount] [asset]\nAssets do not need to be written in capital letters.\n**Assets:** can be listed via **?buy command**.',
    cooldown: 5,
    guildOnly: true,
    execute: async function buy(message, args) {
        function filter(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }

         //With no arguments, lists the categories.
        if(args[0] === undefined) {
            let newMessage = ``, l = 0;
            Object.keys(units).forEach(item => {
                if (item.length > l) l = item.length;
                newMessage += `[${item.padStart(l)}] ${units[item][0]}\n`;
            });
            
            message.channel.send("Available weapons: \n" + `\`\`\`ini\n${newMessage}\`\`\``)
            .then(msg => msg.delete({ timeout: 30000 }))
            .catch(err => console.log(err));
            return;
        }

        //Checking input arguments.
        try {
            args[0] = parseInt(args[0]);
            if (isNaN(args[0])) {
                message.channel.send('Argument is not a number.');
                return;
            } else if (args[1] === undefined) {
                message.channel.send('Missing second argument.');
                return;
            }
            if(!units.hasOwnProperty(args[1].toUpperCase())) {
                message.channel.send('Asset not found.');
                return;
            }
            args[1] = args[1].toUpperCase();
        } catch(err) {
            message.channel.send(`Wrong input. See ${cfg.prefix}help buy for more information. ` + err);
            return;
        }

        const origin = message;
        let tab;

        if (!['wpSurface', 'wpAerial', 'systems'].includes(units[args[1]][1])) {
            tab = undefined;
        } else {
            tab = 'Stockpiles';
        }

        console.log(tab);
        findUnitPrice(args[1], message, cfg.users[message.author.id].nation, tab)
        .then(data => {
            let cost = data[0] * args[0] * 4;
            if (tab !== undefined) {
                cost /= 4;
            }

            console.log(data);

            const embed = new discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Office of Acquisitions`)
            .setURL('https://discord.js.org/')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Amount:', value: args[0], inline: true},
                { name: 'Asset', value: units[args[1]][0], inline: true},
                { name: 'Cost:', value: cost.toLocaleString() + cfg.money},
                { name: 'Do you accept the terms of the supplier agreement?', value: '✅/❌'},
                { name: '\u200B', value: '\u200B'},
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(embed)
            .then(message => {
                message.react("✅");
                message.react("❌");
                message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    let react = collected.first();
                    if (react.emoji.name === '✅') {
                        //Accepted, deleting embed and writing response.
                        message.delete();
                        message.channel.send('Purchasing assets. ✅');
                        ss(['get', `${toCoordinate(data[1])+data[2]}`], message, tab)
                        .then(amount => {
                            amount = amount === false ? 0 : parseInt(amount);

                            ss(['set', `${toCoordinate(data[1])+data[2]}`, amount + args[0]], message, tab);

                            ss(['get', `B${data[2]}`], message)
                            .then(balance => {
                                ss(['set', `B${data[2]}`, parseInt(balance.replace(/[,|$]/g, '')) - cost], message);
                            }).catch(err => console.log(err));

                            if (cost < 0) {
                                report(origin, `${cfg.users[origin.author.id].nation} has sold ${Math.abs(args[0])} ${units[args[1]][0]} for ${(Math.abs(cost)).toLocaleString() + cfg.money}`);
                            } else {
                                report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${units[args[1]][0]} for ${cost.toLocaleString() + cfg.money}`);
                            }
                        })
                        .catch(err => console.error(err));
                    } else {
                        message.delete();
                        message.channel.send('Operation was canceled. ❌');
                        message.delete({timeout: 10000});
                    }
                }).catch(() => {
                    message.delete();
                    message.channel.send('Operation timed out. ❌');
                });
            }).catch(err => console.error(err));
        }).catch(err => console.log(err));
    }
};