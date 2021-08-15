const {prefix} = require('../config.json'), {messageHandler, perm, log} = require("../utils"), fs = require("fs");

module.exports = {
	name: 'log',
	description: 'Log',
	usage: `${prefix}log [OPERATION]
	
	Operations:
	get - replies with a log file.
	set - erases the log file.`,
	args: 0,
	guildOnly: true,
	execute(message, args) {
		if (perm(message, 2) && args[0]) {
			switch (args[0].toLowerCase()) {
				case 'get':
					message.channel.send("Here you have:", { files: ['./out.log'] });
					break;
				case 'del':
					fs.writeFile('out.log', '', function(){});
					break;
				default:
					return messageHandler(message, 'Invalid operation. Please retry.', true);
			}
		}
	},
};