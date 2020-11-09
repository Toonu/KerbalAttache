const {ping} = require("../jsonManagement"), discord = require('discord.js'), cfg = require('../config.json');
module.exports = {
    name: 'map',
    description: 'Command for getting link to you map. Do NOT use in public channels.',
    args: false,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: function mapLink(message) {
        try {
            let userMap = cfg.users[ping(message).id].map;
            const embed = new discord.MessageEmbed()
                .setColor('#faf6f6')
                .setTitle('Your map link.')
                .setURL(userMap)
                .setThumbnail('https://imgur.com/IvUHO31.png')
                .setFooter('Made by the Attaché to the United Nations\nThis message will be auto-destructed in 15 seconds!', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(embed).then(msg => {msg.delete({ timeout: 15000 });});
        } catch(err) {
            console.log(err);
            message.channel.send("No map assigned.").then(msg => {msg.delete({timeout: 9000});});
        }
        message.delete();
    }
}
