module.exports = {
	name: 'userinfo',
	description: 'Shows user information.',
	args: true,
	usage: '<@user>',
	cooldown: 5,
	execute: function execute(message, args) {
		const cfg = require("./../config.json")
		const js = require("./../json");
        const Discord = require('discord.js');

        let user = message.mentions.users.first();

        if(cfg.users[user.id] == undefined) {
            js.createUser(message);
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
                { name: 'Username:', value: user.username, inline: true},
                { name: 'Nation:', value: cfg.users[user.id].nation, inline: true}
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');
            
            if (cfg.users[user.id].notes != ' ') {
                element.addField('Information:', cfg.users[user.id].notes);
            }
        
            message.channel.send(element);
        }
	},
};