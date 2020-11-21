const cfg = require("./../config.json"), discord = require('discord.js'), {report} = require("../game"),
    {createUser, ping} = require("../jsonManagement");
module.exports = {
	name: 'userinfo',
	description: 'Command shows user information.',
	args: false,
	usage: '[@user]',
	cooldown: 5,
    guildOnly: true,
    /**
     * Method print embeds public user info from the config file.
     * @param message   Message author taken as printed user.
     * @param args      Optional User tag of printed user.
     */
	execute: function userinfo(message, args) {
        let user = ping(message);

        if(cfg.users[user.id] === undefined) {
            report(message, `${createUser(user.id)} created by <@${message.author.id}>`, 'user create');
            userinfo(message, args);
        } else {
            // noinspection JSCheckFunctionSignatures
            const element = new discord.MessageEmbed()
            .setColor('#faf6f6')
            .setTitle('User Information')
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setAuthor('Attaché to the UN presents')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Username:', value: user.username, inline: true},
                { name: 'Nation:', value: cfg.users[user.id].nation, inline: true}
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');
            
            if (cfg.users[user.id].notes !== ' ') {
                element.addField('Information:', cfg.users[user.id].notes);
            }
            message.channel.send(element).then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
        }
	},
};