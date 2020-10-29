module.exports = {
    name: 'assets',
    description: 'Method for getting your current assets!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) { 
        const cfg = require('./../config.json')
        const js = require('./../json');
        const fn = require('./../fn')
        const gm = require('./../game');
        const Discord = require('discord.js');


        let filter = cfg.users[message.author.id].nation;
        let user  = message.author;
        if (args[0] != undefined && js.perm(message, 2)) {
            filter = cfg.users[message.mentions.users.first().id].nation;
            user = message.mentions.users.first();
        }
        
        var embed = new Discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`National Roster of ${cfg.users[user.id].nation}`)
        .setURL(`https://docs.google.com/spreadsheets/d/${cfg.users[user.id].sheet}/edit#gid=0`)
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .setFooter('Made by the Attaché to the United Nations. (Link in header)                                                                              .', 'https://imgur.com/KLLkY2J.png');

        const t = new RegExp(/^[0-9]+/g);
        var unitNames;
        var nationRow;

        gm.findHorizontal('Technology', 1, message)
            .then(endCol => {
                endCol = fn.toCoord(endCol);
                fn.ss(['getA', 'E4', `${endCol}4`], message)
                    .then(un => {
                        unitNames = un;
                        gm.findVertical(filter, 'A', message)
                            .then(row => {
                                nationRow = row;
                                fn.ss(['getA', `A${nationRow}`, `${endCol}${nationRow}`], message)
                                    .then(array => {
                                        for(var i = 4; i < array[0].length; i++) {
                                            if (array[0][i] != '.') {
                                                embed.addField(unitNames[0][i - 4], array[0][i], true);
                                            }
                                        }
                                        message.channel.send(embed);
                                    })
                                    .catch(err => console.log(err));
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    }
}
