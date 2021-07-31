const {ping} = require("../utils"), discord = require('discord.js'), cfg = require('../config.json');
module.exports = {
    name: 'map',
    description: 'Command for getting link to you private map. Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}map [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function map(message) {
        try {
            let userMap = cfg.users[ping(message).id].map;
            const embed = new discord.MessageEmbed()
                .setColor('#faf6f6')
                .setTitle('Your map link.')
                .setURL(userMap)
                .setThumbnail('https://imgur.com/IvUHO31.png')
                .setFooter('Made by the Attachè to the United Nations\nThis message will be auto-destructed in 15 seconds!', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(embed)
                .then(mapMessage => mapMessage.delete({ timeout: 15000 }).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
        } catch(error) {
            console.error(error);
            message.channel.send("An error occurred.")
                .then(errorMessage => errorMessage.delete({ timeout: 9000 }).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
        }
        message.delete().catch(error => console.error(error));
    }
}
