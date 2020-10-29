module.exports = {
    name: 'buy',
    description: 'Method for buying new assets!',
    args: true,
    usage: '<amount> <asset>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) { 
        const cfg = require('./../config.json')
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
        var searchRow;

        gm.findUnitPrice(args[1].toUpperCase(), message)
        .then(result => {
            //console.log(result);
            let cost = (parseInt(result) * args[0]);
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Office of Aquisitions`)
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Amount:', value: args[0], inline: true},
                { name: 'Asset', value: args[1], inline: true},
                { name: 'Cost:', value: cost.toLocaleString() + cfg.money},
                { name: 'Do you accept the agreement the terms of the supplier?', value: '✅/❌'},
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
                        gm.findVertical(cfg.users[origin.author.id].nation, 'A', origin)
                        .then(row => {
                            searchRow = row;
                            //Finding unit name column.
                            gm.findHorizontal(args[1].toUpperCase(), 4, origin)
                            .then(col => {
                                //Getting amount of current units + adding new.
                                fn.ss(['get', `${String.fromCharCode(col)+searchRow}`], message)
                                .then(res => {
                                    //Setting new num of units and commenting.
                                    if (!res) {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, args[0]], message);
                                    } else {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, parseInt(res) + args[0]], message);
                                    }
                                    if (cost < 0) {
                                        gm.report(origin, `${cfg.users[origin.author.id].nation} has sold ${Math.abs(args[0])} ${args[1]} for ${(Math.abs(cost)).toLocaleString() + cfg.money}`);
                                    } else {
                                        gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${args[1]} for ${cost.toLocaleString() + cfg.money}`);
                                    }
                                    
                                })
                                .catch(err => message.channel.send(err));
                            })
                            .then(res => {
                                fn.ss(['get', `B${searchRow}`], message)
                                .then(money => {
                                    fn.ss(['set', `B${searchRow}`, (parseInt(money.replace(/[,|$]/g, '')) - cost)], message);
                                })
                            })
                            .catch(err => message.channel.send(err));

                        })
                        .catch(err => {
                            message.channel.send(err);
                        });
                    } else {
                        message.delete();
                        message.channel.send('Operation was canceled. ❌');
                    }
                })
                .catch(err => console.error(`Operation was canceled after one minute. Err: ` + err));
            })
            .catch(err => console.error('Error, please retry the acquisiton.' + err));
        })
        .catch(err => console.error(err));
    }
};
