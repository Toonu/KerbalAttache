const cfg = require("./../config.json"), {ping} = require("../jsonManagement"), discord = require('discord.js');
module.exports = {
    name: 'sheet',
    description: 'Command for getting link to your spreadsheet! Do NOT use in public channels.',
    args: false,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: function sheet(message, args) {
        //If no argument or tag of user, shows link to his sheet.
        if (args[0] === undefined || args[0].startsWith('<@')) {
            let usrSheet = cfg.users[ping(message).id].sheet;

            const embed = new discord.MessageEmbed()
            .setColor('#faf6f6')
            .setTitle('Your sheet link.')
            .setURL(`https://docs.google.com/spreadsheets/d/${usrSheet}/edit#gid=0`)
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attaché to the United Nations\nThis message will be auto-destructed in 15 seconds!', 'https://imgur.com/KLLkY2J.png');
            message.channel.send(embed)
            .then(msg => {
                msg.delete({ timeout: 15000 });
                message.delete();
            })
        }
    }
}
