const cfg = require('./../config.json'), units = require('./../units.json'), discord = require('discord.js'),
    {report, findData} = require("../game"), {get, set} = require("../sheet");
module.exports = {
    name: 'buy',
    description: 'Command for buying new assets. Do NOT use in public channels.',
    args: false,
    usage: `[amount] [asset]
Assets do not need to be written in capital letters, the command is case insensitive.
**Assets:** can be listed via **?buy** command.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function buy(message, args, tab = undefined) {
        function filter(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }
         //No arguments lists the categories.
        if(args[0] === undefined) {
            let newMessage = ``, l = 0;
            Object.keys(units).forEach(item => {
                 // noinspection ReuseOfLocalVariableJS
                if (item.length > l) l = item.length;
            });

            try {
                Object.keys(units).forEach(item => {
                    if (item === 'ResBudget') {
                        throw '';
                    }
                    newMessage += `[${item.padStart(l)}] ${units[item][0]}\n`;
                });
            } catch (e) {}


            message.channel.send("Available weapons: \n" + `\`\`\`ini\n${newMessage}\`\`\``)
            .then(msg => msg.delete({ timeout: 30000 }))
            return message.delete({timeout: 50});

        }

        //Checking input arguments.
        args[0] = parseInt(args[0]);
        if (isNaN(args[0])) {
            message.channel.send('Argument is not a number.').then(msg => msg.delete({timeout: 9000}));
            return message.delete({timeout: 9000});
        } else if (args[1] === undefined) {
            message.channel.send('Missing second argument.').then(msg => msg.delete({timeout: 9000}));
            return message.delete({timeout: 9000});
        }
        args[1] = args[1].toUpperCase();
        if(!units.hasOwnProperty(args[1])) {
            message.channel.send('Asset not found.').then(msg => msg.delete({timeout: 9000}));
            return message.delete({timeout: 9000});
        }

        findData(args[1], cfg.users[message.author.id].nation, false,tab)
        .then(data => {
            let cost = data[0] * args[0] * 4;
            if (tab !== undefined) cost /= 4;
            if (args[0] < 0) cost *= 0.7;

            // noinspection JSCheckFunctionSignatures
            const embed = new discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Office of Acquisitions`)
            .setURL('https://discord.js.org/')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Amount:', value: args[0], inline: true},
                { name: 'Asset', value: units[args[1]][0], inline: true},
                { name: 'Cost:', value: cost.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })},
                { name: 'Do you accept the terms of the supplier agreement?', value: '✅/❌'},
                { name: '\u200B', value: '\u200B'},
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');
            message.channel.send(embed)
            .then(msg => {
                message.delete();
                msg.react("✅");
                msg.react("❌");
                msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    let react = collected.first();
                    if (react.emoji.name === '✅') {
                        //Accepted, deleting embed and writing response.
                        msg.delete();
                        msg.channel.send('Purchasing assets. ✅').then(newMessage => newMessage.delete({timeout: 15000}));
                        //Setting new unit amount, getting account money and setting new amount and finally reporting to the moderator channel.
                        set(`${data[1]+data[2]}`, data[3] + args[0], tab);
                        get(`B${data[2]}`)
                            .then(balance => {
                                set(`B${data[2]}`, parseInt(balance.replace(/[,|$]/g, '')) - cost)
                            })
                            .catch(err => console.error(err));
                        if (cost < 0) {
                            report(message, `${cfg.users[message.author.id].nation} has sold ${Math.abs(args[0])} ${units[args[1]][0]} for ${(Math.abs(cost)).toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })}`, this.name);
                        } else {
                            report(message, `${cfg.users[message.author.id].nation} has bought ${args[0]} ${units[args[1]][0]} for ${cost.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })}`, this.name);
                        }
                    } else {
                        msg.delete();
                        msg.channel.send('Operation was canceled. ❌').then(newMessage => newMessage.delete({timeout: 5000}));
                    }
                }).catch(err => {
                    msg.delete();
                    msg.channel.send('Operation timed out. ❌').then(newMessage => newMessage.delete({timeout: 5000}));
                });
            }).catch(err => console.error(err));
        }).catch(err => console.error(err));
    }
};