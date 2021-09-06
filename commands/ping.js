const {log} = require("../utils");
const {prefix} = require('../database.json');

module.exports = {
	name: 'ping',
	description: 'Ping! Ping! Ping!',
	usage: `${prefix}ping`,
	args: 0,
	guildOnly: true,
	usesDB: false,
	execute(message) {
		message.channel.send('Loading data').then(async (msg) => {
			msg.delete().catch(error => log(error, true));
			message.channel.send(`Pong. ${msg.createdTimestamp - message.createdTimestamp}ms.`)
			.then(msg => msg.delete({timeout: 10000}).catch(error => log(error, true)));
		});
	}
};