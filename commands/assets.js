module.exports = {
    name: 'assets',
    description: 'Command for getting your current assets! Do NOT use in public channels.',
    args: false,
    usage: '<M:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require('./../config.json')
        const js = require('./../json');
        const fn = require('./../fn')
        const gm = require('./../game');
        const Discord = require('discord.js');


        let nation = cfg.users[message.author.id].nation;
        let user  = message.author;
        if (args[0] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
            user = message.mentions.users.first();
        } else if (args[0] != undefined) {
            return;
        }
        
        var embed = new Discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`National Roster of ${nation}`)
        .setURL(`https://docs.google.com/spreadsheets/d/${cfg.users[user.id].sheet}/edit#gid=0`)
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .setFooter('Made by the Attaché to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');

        var embedW = new Discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`National Roster of ${nation}`)
        .setURL(`https://docs.google.com/spreadsheets/d/${cfg.users[user.id].sheet}/edit#gid=0`)
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .setFooter('Made by the Attaché to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');

        const t = new RegExp(/^[0-9]+/g);
        var weaponsArray = [];

        //Weapons setup
        nation = await gm.findVertical(nation, 'A', message, 'Stockpiles')
            .then(nation => {
                fn.ss(['getA', 'A4', `W${nation}`], message, 'Stockpiles')
                .then(weapArr => { 
                    for(var i = 1; i < weapArr[0].length; i++) {
                        if (weapArr[weapArr.length-1][i] != '.') {
                            embedW.addField(weapArr[0][i], weapArr[weapArr.length-1][i], true);
                        }
                    }
                })
                .catch(err => console.error(err));
            })
            .catch(err => console.error(err));  

        //Units setup
        endCol = await gm.findHorizontal('Surface', 1, message)
        endCol = fn.toCoord(endCol - 1);
        let unitNames = await fn.ss(['getA', 'E4', `${endCol}4`], message)
        let nationRow = await gm.findVertical(nation, 'A', message)
        array = await fn.ss(['getA', `A${nationRow}`, `${endCol}${nationRow}`], message)
        for(var i = 4; i < array[0].length; i++) {
            if (array[0][i] != '.') {
                embed.addField(unitNames[0][i - 4], array[0][i], true);
            }
        }
        let unitsEmbed = embed.fields;


        //Embed switching mechanism
        let currentEmbed = embed;
        let switchEmbeds = await embUnits(currentEmbed, message);
        while(switchEmbeds[0]) {
            if (switchEmbeds[0] && currentEmbed == embed) {
                currentEmbed = embedW;
            } else {
                currentEmbed = embed;
            }
            switchEmbeds[1].delete();
            console.log(embed.id);
            switchEmbeds = await embUnits(currentEmbed, message);
        }
    }    
}


function embUnits(embed, message) {
    return new Promise(function (resolve, reject) {
        const emojiFilter = (reaction, user) => {
	        return (reaction.emoji.name === '➡️' || reaction.emoji.name === '⬅️' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };

        message.channel.send(embed)
            .then(msg => {
                msg.react('⬅️');
                msg.react('➡️');
                msg.react('❌');
                msg.awaitReactions(emojiFilter, { max: 1, time: 60000, errors: ['time'] })
                    .then(collected => {
                        react = collected.first();
                        if (react.emoji.name == '➡️' || react.emoji.name == '⬅️' ) {
                            resolve([true,msg]);
                        } else if (react.emoji.name == '❌') {
                            msg.delete();
                            message.delete();
                            resolve([false,msg]);
                        }
                    })
                    .catch(err => {
                        msg.delete();
                        message.delete();
                        message.channel.send('Operation timed out. ❌');
                    })
            })
            .catch(err => {
                msg.delete();
                message.delete();
                resolve([false]);
            })
    })
}