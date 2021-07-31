const {prefix} = require('../config.json');

module.exports = {
	name: 'ping',
	description: 'Ping!',
	usage: `${prefix}ping`,
	args: 0,
	guildOnly: true,
	execute(message) {
		message.channel.send('Pong.')
			.then(pongMessage => pongMessage.delete({timeout: 9000})
				.catch(error => console.error(error)))
			.catch(networkError => console.error(networkError));
		message.delete().catch(error => console.error(error));
	},
};