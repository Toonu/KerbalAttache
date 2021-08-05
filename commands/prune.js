const {perm, messageHandler, log} = require("../utils"), {prefix} = require('../config.json')

module.exports = {
	name: 'prune',
	description: 'Command prunes N messages from channel.',
	usage: `${prefix}prune [AMOUNT] [OLD]
	Setting OLD option to true to enables deleting messages older than two weeks.`,
	guildOnly: true,
	args: 1,
	cooldown: 5,
	execute: async function prune(message, args) {
		//Parse returns NaN if NaN.
		args[0] = parseInt(args[0]) + 1;
		if (isNaN(args[0])) {
			return messageHandler(message, new Error(`InvalidTypeException: That doesn't seem to be a valid number. Canceling operation.`), true);
		} else if (!perm(message, 1)) {
			return message.delete().catch(error => log(error, true));
		}

		//Parse oldMessages bool.
		let bool = false;
		//if is not undefined and is true
		if (args[1] && args[1].toLowerCase() === "true") {
			bool = true;
		}

		//Deletion is maxed at 100 by Discord, deleting them by batches and finally by the rest.
		while (args[0] > 100) {
			await message.channel.bulkDelete(100, bool)
				.then(() => args[0] -= 100)
				.catch(error => {
					return messageHandler(message, error, true);
				});
		}

		if (args[0] > 0) {
			message.channel.bulkDelete(args[0], bool)
				.then(() => {
					//Logs the operation.
					messageHandler(message, `Deleted ${args[0]} messages.`);
					log(`Messages deleted: ${args[0]}`);
				})
				.catch(error => {
					messageHandler(message, error);
			});
		}
	}
};