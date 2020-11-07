export const name = 'sheet';
export const description = 'Command for getting data from spreadsheet! Alternatively sends link to your own personal sheet which would be deprecated after removal of the private sheets.\nDo NOT use in public channels.';
export const args = false;
export const usage = '<D:operation> <x> <y> <cols> <rows> <tab>';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for retrieving and manipulating data of sheet.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [String, String, String, Number, Number, String].
 */
export function execute(message, args) {
    const cfg = require("./../config.json");
    const fn = require("./../fn");
    const js = require('./../json');
    const Discord = require('discord.js');
    try {
        if (args[0] == undefined || args[0].startsWith('<@')) {
            let link = cfg.users[message.author.id].sheet;
            try {
                if (args[0].startsWith('<@') && js.perm(message, 1)) {
                    link = cfg.users[message.mentions.users.first().id].sheet;
                }
            } catch (err) { }

            const embed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Your sheet link.')
                .setURL(`https://docs.google.com/spreadsheets/d/${link}/edit#gid=0`)
                .setThumbnail('https://imgur.com/IvUHO31.png')
                .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');
            message.channel.send(embed)
                .then(msg => {
                    msg.delete({ timeout: 10000 });
                    message.delete({ timeout: 10000 });
                })
                .catch(err => console.log(msg));
            return;
        }
        args[3] = parseInt(args[3]);
        args[4] = parseInt(args[4]);
        if (args[1] == 'getA') {
            if (isNaN([args[3]]) || isNaN([args[4]]))
                throw 'Argument is not a number. Canceling operation.';
        }

    } catch (err) {
        message.channel.send(err);
        return;
    }

    if (js.perm(message, 1)) {
        fn.ss(args, message)
            .then(result => {
                if (result) {
                    message.channel.send("Operation successful.");
                } else {
                    message.channel.send("Result: " + result);
                }
            })
            .catch(err => message.channel.send("Result: " + err));
    }
}
