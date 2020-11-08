const cfg = require("./../config.json"), {ss} = require("../fn"), {perm, ping} = require("../jsonManagement"),
    discord = require('discord.js');
module.exports = {
    name: 'sheet',
    description: 'Command for getting data from spreadsheet! Alternatively sends link to your own personal sheet which would be deprecated after removal of the private sheets.\nDo NOT use in public channels.',
    args: false,
    usage: '[D:operation] [x] [y] [cols] [rows] [tab]',
    cooldown: 5,
    guildOnly: true,
    execute: function sheet(message, args) {
        //If no argument or tag of user, shows link to his sheet.
        if (args[0] === undefined || args[0].startsWith('<@')) {
            let usrSheet = cfg.users[ping(message).id].sheet;

            const embed = new discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Your sheet link.')
            .setURL(`https://docs.google.com/spreadsheets/d/${usrSheet}/edit#gid=0`)
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attaché to the United Nations\nThis message will be auto-destructed in 15 seconds!', 'https://imgur.com/KLLkY2J.png');
            message.channel.send(embed)
            .then(msg => {
                msg.delete({ timeout: 15000 });
                message.delete();
            })
            return;
        }

        if (!perm(message, 1, true)) {
            message.delete();
            return;
        }

        ss(args, message).then(result => {
            if (result !== false) {
                message.channel.send(`Operation successful: ${result}`).then(msg => {
                    msg.delete({timeout: 9000});
                });
            } else {
                message.channel.send('Operation failed').then(msg => {
                    msg.delete({timeout: 9000});
                });
            }
            message.delete();
        })
        .catch(err => message.channel.send("Error: " + err));
    }
}
