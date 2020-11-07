module.exports = {
    name: 'map',
    description: 'Command for getting link to you map. Do NOT use in public channels.',
    args: false,
    usage: '<M:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json");
        const js = require('../jsonManagement');
        const discord = require('discord.js');
        try {
            let map;
            if (args[0] !== undefined && js.perm(message, 2)) {
                map = cfg.users[message.mentions.users.first().id].map;
            } else {
                map = cfg.users[message.author.id].map;
            }
            
            const embed = new discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Your map link.')
                .setURL(map)
                .setThumbnail('https://imgur.com/IvUHO31.png')
                .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(embed)
            .then(msg => {
                msg.delete({ timeout: 10000 });
                message.delete({ timeout: 10000 });
            })
            .catch(err => console.log(err));

        } catch(err) {
            console.log(err);
            message.channel.send("No map assigned.")
        }
    }
}
