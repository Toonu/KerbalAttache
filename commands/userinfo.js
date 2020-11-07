export const name = 'userinfo';
export const description = 'Shows user information.';
export const args = false;
export const usage = '<@user>';
export const cooldown = 5;

/**
 * Function for showing user's public information.
 * @param {Message} message   Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [User].
 */
export function execute(message, args) {
    const cfg = require("./../config.json");
    const js = require("./../json");
    const Discord = require('discord.js');

    var user = message.author;
    if (message.mentions.users.first() != undefined) {
        user = message.mentions.users.first();
    }

    if (cfg.users[user.id] == undefined) {
        js.createUser(user.id);
        execute(message, args);
        return;
    } else {
        const element = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('User Information')
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setAuthor('Attaché to the UN presents')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Username:', value: user.username, inline: true },
                { name: 'Nation:', value: cfg.users[user.id].nation, inline: true }
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

        if (cfg.users[user.id].notes != ' ') {
            element.addField('Information:', cfg.users[user.id].notes);
        }

        message.channel.send(element);
    }
}