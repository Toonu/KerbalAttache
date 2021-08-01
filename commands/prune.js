const {perm} = require("../utils"), {log} = require("../game"), {prefix} = require('../config.json')

module.exports = {
	name: 'prune',
	description: 'Command prunes amount of messages from channel. Set Old to true to enable deleting messages older than two weeks.',
	usage: `${prefix}prune [AMOUNT] [OLD]`,
	guildOnly: true,
	args: 1,
	cooldown: 5,
	execute: async function prune(message, args) {
		//Parse returns NaN if NaN.
		args[0] = parseInt(args[0]) + 1;
		if (isNaN(args[0])) {
			message.channel.send(`That doesn't seem to be a valid number. Canceling operation.`)
				.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
				.catch(networkError => console.error(networkError));

			return message.delete().catch(error => console.error(error));
		} else if (!perm(message, 1)) {
			return message.delete().catch(error => console.error(error));
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
					console.error(error);
					message.channel.send(error.message)
						.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
						.catch(networkError => console.error(networkError))
				});
		}

		if (args[0] > 0) {
			message.channel.bulkDelete(args[0], bool)
				.then(() => {
					//Logs the operation.
					message.channel.send(`Deleted ${args[0]} messages.`)
						.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
						.catch(networkError => console.error(networkError));
					log(`Messages deleted: ${args[0]}`);
				})
				.catch(error => {
				console.error(error);
				message.channel.send(error.message)
					.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
					.catch(networkError => console.error(networkError));
			});
		}
	}
};