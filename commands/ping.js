const {prefix} = require('../config.json'), {messageHandler} = require("../utils");

module.exports = {
	name: 'ping',
	description: 'Ping!',
	usage: `${prefix}ping`,
	args: 0,
	guildOnly: true,
	execute(message) {
		messageHandler(message, 'Pong.', true);
	},
};