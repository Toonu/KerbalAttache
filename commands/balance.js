module.exports = {
    name: 'balance',
    description: 'Method for getting your current money balance (amount of money on account)!',
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

        gm.findVertical('Data', 'A', message)
        .then(row => {
            fn.ss(['getA', 'A5', `AZ${row - 1}`], message)
            .then(array => {
                array.forEach(element => {
                    var filter = cfg.users[message.author.id].nation;
                    if (args[0] != undefined && js.perm(message, 2)) {
                        filter = cfg.users[message.mentions.users.first().id].nation;
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
                        )
                        .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

                        message.channel.send(embed);

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
