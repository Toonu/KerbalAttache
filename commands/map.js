export const name = 'map';
export const description = 'Command for getting link to you map. Do NOT use in public channels.';
export const args = false;
export const usage = '<M:@user>';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function to print link to the message author's or tagged person's nation map.
 * @param {Message} message     Message to retrieve channel to interact with.
 * @param {Array} args          Arguments array of [User]. User's map will be printed out.
 */
export function execute(message, args) {
    const cfg = require("./../config.json");
    const js = require('./../json');
    const Discord = require('discord.js');
    try {
        let map = cfg.users[message.author.id].map;;
        if (args[0] != undefined && js.perm(message, 2))
            map = cfg.users[message.mentions.users.first().id].map;

        const embed = new Discord.MessageEmbed()
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
            .catch(err => { throw err; });

    } catch (err) {
        console.log(err);
        message.channel.send("No map assigned.");
    }
}
