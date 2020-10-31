module.exports = {
    name: 'buy',
    description: 'Command for buying new assets and systems! Do NOT use in public channels.',
    args: true,
    usage: '<amount> <asset>\nAssets do not need to be written in capital letters.\n**Assets:**\n*Buildings:* AIRPORT, FOB, PORT, RADAR\n*Surface assets:* MBT, AFV, IFV, APC, SAM, SPAAG, SF\n*Aerospace assets:* L, M, H, LA, VL, VTOL, SAT, OV\n*Naval assets:* K, F, DD, CC, BC, BB, CL, CV\n**Weapons:**\n*Aerial:* SRAAM, MRAAM, LRAAM, AGM, ASHM, ATGM, SRSAM ,MRSAM, LRSAM, SEAD\n*Surface:* CRUISE, BALLISTIC, ABM, ASM\n*Bombs:* UNGUI, GUI, EW, RECON, FUEL, GUNPOD',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require('./../config.json');
        const units = require('./../units.json');
        const fn = require('./../fn');
        const gm = require('./../game');
        const Discord = require('discord.js');

        const filter = (reaction, user) => {
	        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };
        
        //Checking input arguments.
        try {
            args[0] = parseInt(args[0]);
            if (isNaN(args[0])) throw 'Argument is not a number.'
            if (args[1] == undefined) throw 'Missing second argument.'
            if(!units.hasOwnProperty(args[1].toUpperCase())) throw 'Asset not found.'
            args[1] = args[1].toUpperCase();
        } catch(err) {
            message.channel.send(`Wrong input. See ${cfg.prefix}help buy for more information. ` + err);
            return;
        }
        
        var origin = message;
        let tab;

        if (!['wpSurface', 'wpAerial', 'systems'].includes(units[args[1]][1])) {
            tab = undefined;
        } else {
            tab = 'Stockpiles';
        }

        //console.log(tab);
        gm.findUnitPrice(args[1], message, cfg.users[message.author.id].nation, tab)
        .then(data => {
            let cost = data[0] * args[0] * 4;
            if (tab != undefined) {
                cost /= 4;
            }
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Office of Aquisitions`)
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
                    react = collected.first();
                    if (react.emoji.name == '✅') {
                        //Accepted, deleting embed and writing response.
                        message.delete();
                        message.channel.send('Purchasing assets. ✅');
                        fn.ss(['get', `${fn.toCoord(data[1])+data[2]}`], message, tab)
                        .then(amount => {
                            if (amount == false) {
                                amount = 0;
                            } else {
                                amount = parseInt(amount);
                            }
                            
                            fn.ss(['set', `${fn.toCoord(data[1])+data[2]}`, amount + args[0]], message, tab);

                            fn.ss(['get', `B${data[2]}`], message)
                            .then(balance => {
                                fn.ss(['set', `B${data[2]}`, parseInt(balance.replace(/[,|$]/g, '')) - cost], message);
                            }).catch(err => console.log(err));

                            if (cost < 0) {
                                gm.report(origin, `${cfg.users[origin.author.id].nation} has sold ${Math.abs(args[0])} ${units[args[1]][0]} for ${(Math.abs(cost)).toLocaleString() + cfg.money}`);
                            } else {
                                gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${units[args[1]][0]} for ${cost.toLocaleString() + cfg.money}`);
                            }
                        })
                        .catch(err => console.error(err));
                    } else {
                        message.delete();
                        message.channel.send('Operation was canceled. ❌');
                    }
                }).catch(err => {
                    message.delete();
                    message.channel.send('Operation timed out. ❌');
                });
            }).catch(err => console.error(err));
        }).catch(err => console.log(err));
    }
};
