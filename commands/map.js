const {ping, messageHandler} = require("../utils"), discord = require('discord.js'), cfg = require('../config.json');
module.exports = {
    name: 'map',
    description: 'Command gives user link user\'s private map. Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}map [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function map(message, args, db) {
        let discordUser = ping(message);
        let state;
        for (state of db.users) {
            if (state.state && state.user.isEqual(discordUser)) {
                break;
            }
        }
        
        if (!state) {
            return messageHandler(message, 'InvalidArgumentException: User or map not found.', true);
        }

        const embed = new discord.MessageEmbed()
            .setColor(state.colour)
            .setTitle('Your map link.')
            .setURL(state.map)
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attachè to the United Nations\nThis message will be auto-destructed in 15' +
                ' seconds!', 'https://imgur.com/KLLkY2J.png');

        messageHandler(message, embed, true, 15000);
    }
};
