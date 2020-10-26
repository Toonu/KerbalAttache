module.exports = {
	name: 'userinfo',
	description: 'Shows user information.',
	args: true,
	usage: '<@users separated by space>',
	cooldown: 5,
	execute(message, args) {
		const cfg = require("./../config.json")
		const fn = require("./../fn");

		if (!message.mentions.users.size) {
			return message.reply('you need to tag a user in order to get information about them!');
		} else {
			fn.createUser(message);

			const taggedList = message.mentions.users.map(user => {
				return `Your username: ${user.username}\nYour ID: ${user.id}\nNation: ${cfg.users[user.id].nation}`;
			});
			message.channel.send(taggedList);
		}
	},
};