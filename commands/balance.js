module.exports = {
    name: 'balance',
    description: 'Command for getting your current state statistics! Do NOT use in public channels.',
    args: false,
    usage: '<A:user>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) { 
        const cfg = require('./../config.json')
        const js = require('./../json');
        const fn = require('./../fn')
        const gm = require('./../game');
        const Discord = require('discord.js');

        const emojiFilter = (reaction, user) => {
	        return (reaction.emoji.name === '❌') && user.id === message.author.id;
        };

        gm.findVertical('Data', 'A', message)
        .then(row => {
            fn.ss(['getA', 'A5', `AZ${row - 1}`], message)
            .then(array => {
                array.forEach(element => {
                    var filter = cfg.users[message.author.id].nation;
                    if (args[0] != undefined && js.perm(message, 2)) {
                        filter = cfg.users[message.mentions.users.first().id].nation;
                    }  else if (args[0] != undefined) {
                        return;
                    }
                    if (element[0].startsWith(filter)) {
                        let user = message.mentions.users.first();
                        if (user == undefined) {
                            user = message.author;
                        }
                        
                        const embed = new Discord.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(`National Bank of ${cfg.users[user.id].nation}`)
                        .setURL('https://discord.js.org/') //URL clickable from the title
                        .setThumbnail('https://imgur.com/IvUHO31.png')
                        .addFields(
                            { name: 'Nation:', value: cfg.users[user.id].nation},
                            { name: 'Account:', value: parseInt(element[1].replace(/[,|$]/g, '')).toLocaleString() + cfg.money},
                            { name: 'Balance:', value: parseInt(element[2].replace(/[,|$]/g, '')).toLocaleString() + cfg.money},
                            { name: 'Research budget:', value: parseInt(element[37].replace(/[,|$]/g, '')).toLocaleString() + cfg.money, inline: true},
                            { name: 'Research points:', value: `${parseInt(element[36])}RP`, inline: true},
                            { name: 'Tiles:', value: parseInt(element[38])},
                        )
                        .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

                        message.channel.send(embed)
                        .then(message => {
                            message.react('❌');
                            message.awaitReactions(emojiFilter, { max: 1, time: 60000, errors: ['time'] })
                                .then(collected => {
                                    react = collected.first();
                                    if (react.emoji.name == '❌') {
                                        message.delete();
                                    }
                                });
                        });
                        
                        throw "";
                    }
                })
                .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
    }
}
