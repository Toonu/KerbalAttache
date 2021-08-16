const {prefix} = require('../config.json'), {log} = require("../utils");

module.exports = {
	name: 'ping',
	description: 'Ping! Ping! Ping!',
	usage: `${prefix}ping`,
	args: 0,
	guildOnly: true,
	execute(message) {
		message.channel.send('Loading data').then(async (msg) => {
			msg.delete().catch(error => log(error, true));
			message.channel.send(`Pong. ${msg.createdTimestamp - message.createdTimestamp}ms.`)
			.then(msg => msg.delete({timeout: 10000}).catch(error => log(error, true)));
		});
	},
};