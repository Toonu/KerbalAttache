// noinspection JSUnusedLocalSymbols

const cfg = require('../config.json'), {createUser, ping, messageHandler, report} = require('../utils'),
    Discord = require('discord.js');
module.exports = {
	name: 'userinfo',
	description: 'Command shows user information. Other user information can be used only by moderator.',
	args: 0,
	usage: `${cfg.prefix}userinfo [USER]`,
	cooldown: 5,
    guildOnly: true,
	execute: function userinfo(message, args) {

        //Defining user.
	    let user;
        try {
            user = ping(message);
            if(!cfg.users[user.id]) {
                //Creating non-existent user
                report(message, `${createUser(user.id)} created by <@${message.author.id}>`, 'userinfo');
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }

        //Gathering user info and printing.
        let configUser = cfg.users[user.id];
        // noinspection JSCheckFunctionSignatures
        const embed = new Discord.MessageEmbed()
        .setColor(configUser.color)
        .setTitle('User Information')
        .setURL('https://discord.js.org/') //URL clickable from the title
        .setAuthor('Attachè to the UN presents')
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .addFields(
            { name: 'Username:', value: user.username, inline: true},
            { name: 'Nation:', value: configUser.nation, inline: true},
            { name: 'Demonym:', value: configUser.demonym, inline: true},
            { name: 'Color:', value: configUser.color, inline: true},
            { name: 'hasMap?', value: configUser.map ? 'true' : 'false', inline: true}
        )
        .setFooter('Made by the Attachè to the United Nations', 'https://imgur.com/KLLkY2J.png');

        if (configUser.notes !== ' ') {
            embed.addField('Information:', configUser.notes);
        }
        messageHandler(message, embed, true);
	},
};