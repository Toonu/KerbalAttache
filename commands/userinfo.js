const cfg = require("../config.json"), discord = require('discord.js'), {report} = require("../game"),
    {createUser, ping} = require("../utils");
module.exports = {
	name: 'userinfo',
	description: 'Command shows user information. Other user information can be used only by moderator.',
	args: 0,
	usage: `${cfg.prefix}userinfo [USER]`,
	cooldown: 5,
    guildOnly: true,
	execute: function userinfo(message, args) {

	    //Defining user.
        let user = ping(message);
        if(cfg.users[user.id] === undefined) {
            //Creating non-existent user.
            report(message, `${createUser(user.id)} created by <@${message.author.id}>`, 'usercreate');
            userinfo(message, args);
        } else {
            //Gathering user info and printing.
            let internalUser = cfg.users[user.id];
            // noinspection JSCheckFunctionSignatures
            const embed = new discord.MessageEmbed()
            .setColor(internalUser.color)
            .setTitle('User Information')
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setAuthor('Attachè to the UN presents')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Username:', value: user.username, inline: true},
                { name: 'Nation:', value: internalUser.nation, inline: true},
                { name: 'Demonym:', value: internalUser.demonym, inline: true},
                { name: 'Color:', value: internalUser.color, inline: true},
                { name: 'hasMap?', value: internalUser.map ? 'true' : 'false', inline: true}
            )
            .setFooter('Made by the Attachè to the United Nations', 'https://imgur.com/KLLkY2J.png');
            
            if (internalUser.notes !== " ") {
                embed.addField('Information:', internalUser.notes);
            }
            message.channel.send(embed)
                .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
            message.delete().catch(error => console.error(error));
        }
	},
};