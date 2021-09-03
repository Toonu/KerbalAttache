const {messageHandler, perm} = require("../utils"), fs = require("fs");
const {prefix} = require('../database.json');

module.exports = {
	name: 'log',
	description: 'Command for getting and manipulating log information.',
	usage: `${prefix}log [OPERATION]
	
	Operations:
	get - replies with a log file.
	set - erases the log file.`,
	args: 0,
	guildOnly: true,
	execute(message, args, db) {
		if (perm(message, 2) && args[0]) {
			switch (args[0].toLowerCase()) {
				case 'get':
					message.channel.send("Here you have:", { files: ['./out.log'] });
					break;
				case 'del':
					fs.writeFile('out.log', '', function(){});
					break;
                case 'export':
                    db.export();
                    db.exportSheet();
                    break;
				default:
					return messageHandler(message, 'Invalid operation. Please retry.', true);
			}
		}
		messageHandler(message, 'Finished.', true);
	}
};