module.exports = {
	name: 'userinfo',
	description: 'Shows user information.',
	args: false,
	usage: '[@user]',
	cooldown: 5,
    /**
     * Method print embeds public user info from the config file.
     * @param message   Message author taken as printed user.
     * @param args      Optional User tag of printed user.
     */
	execute: function userinfo(message, args) {
		const cfg = require("./../config.json");
		const js = require("../jsonManagement");
        const discord = require('discord.js');

        let user = js.ping(message);

        if(cfg.users[user.id] === undefined) {
            js.createUser(user.id);
            userinfo(message, args);
        } else {
            const element = new discord.MessageEmbed()
            .setColor('#0099ff')
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
            message.channel.send(element).then(msg => msg.delete({timeout: 12000}));
            message.delete({timeout: 12000});

        }
	},
};