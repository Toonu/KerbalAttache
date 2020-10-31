module.exports = {
    name: 'test',
    description: 'Method for testing latest projects!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require('./../config.json');
        const units = require('./../units.json');
        const js = require('./../json');
        const fn = require('./../fn');
        const gm = require('./../game');
        const Discord = require('discord.js');

        const filter = (reaction, user) => {
	        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };

        try {
            //Easter egg, part one, carrts can be obtained from userinfo.
            if (message.mentions.users.first().id === '693908421396922480' && cfg.users[message.author.id].egg == 'carrot') {
                message.channel.send('Owned');
                return;
            } else if (message.mentions.users.first().id === '693908421396922480') {
                message.reply("You need carrots first.");
                return;
            } 
        } catch(err) {
            if (args[1].startsWith('carrot')) {
                js.modifyUser(message, message.author.id, 0, "carrot");
                message.reply('Carrot found.')
                return;  
            }
        }
        
        //Checking input arguments.
        try {
            args[0] = parseInt(args[0]);
            if (args[1] == undefined) throw "Missing second argument."
        } catch(err) {
            message.channel.send(`Wrong number input. See ${cfg.prefix}help buy for more information. ` + err);
            return;
        }
        
        var origin = message;
        var data;

        if (!units.wpAerial.hasOwnProperty(args[1]) || !units.wpSurface.hasOwnProperty(args[1]) || !units.system.hasOwnProperty(args[1])) {
            data = await gm.findUnitPrice(args[1].toUpperCase(), message, cfg.users[message.author.id].nation);
        } else {
            data = await gm.findUnitPrice(args[1].toUpperCase(), message, cfg.users[message.author.id].nation, 'Stockpiles');
        }

        let cost = (parseInt(result) * args[0] * 4);
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Office of Aquisitions`)
        .setURL('https://discord.js.org/') //URL clickable from the title
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
        .then(function (message) {
            message.react("✅");
            message.react("❌");
            //Reacting to the embed.
            message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                react = collected.first();
                if (react.emoji.name == '✅') {
                    //Accepted, deleting embed and writing response.
                    message.delete();
                    message.channel.send('Purchasing assets. ✅');
                    unitAmount = await parseInt(fn.ss(['get', `${data[1]+data[2]}`], message).catch(err => console.error(err)));
                    if (!unitAmount) {
                        fn.ss(['set', `${data[1]+data[2]}`, args[0]], message);
                    } else {
                        fn.ss(['set', `${data[1]+data[2]}`, unitAmount + args[0]], message);
                    }
                    if (cost < 0) {
                        gm.report(origin, `${cfg.users[origin.author.id].nation} has sold ${Math.abs(args[0])} ${args[1]} for ${(Math.abs(cost)).toLocaleString() + cfg.money}`);
                    } else {
                        gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${args[1]} for ${cost.toLocaleString() + cfg.money}`);
                    }
                } else {
                    message.delete();
                    message.channel.send('Operation was canceled. ❌');
                }
            }).catch(err => console.error(log));
        }).catch(err => console.error(log));
    }
};