module.exports = {
	name: 'userinfo',
	description: 'Shows user information.',
	args: true,
	usage: '<@user>',
	cooldown: 5,
	execute(message, args) {
		const cfg = require("./../config.json")
		const js = require("./../json");
        const Discord = require('discord.js');

		if (!message.mentions.users.size) {
			return message.reply('you need to tag a user in order to get information about them!');
		} else {
			js.createUser(message);

            let user = message.mentions.users.first();

            const element = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('User Information')
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setAuthor('Attaché to the UN presents')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Username:', value: user.username, inline: true},
                { name: 'Nation:', value: cfg.users[user.id].nation, inline: true},
                //{ name: '\u200B', value: '\u200B' }, Discord color space
                { name: 'Information:', value: cfg.users[user.id].notes},
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(element);
		}
	},
};