const {ping, messageHandler} = require("../utils"), discord = require('discord.js'), cfg = require('../config.json');
module.exports = {
    name: 'map',
    description: 'Command gives user link user\'s private map. Do NOT use in public channels.',
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

            messageHandler(message, embed, true, 15000);
        } catch(error) {
            messageHandler(message, error, true);
        }
    }
}
