const {perm} = require("../utils"), {prefix} = require('../config.json'), {log} = require("../game");
module.exports = {
	name: 'spam',
	description: 'Command for sending spam messages.',
	args: 1,
	usage: `${prefix}spam [AMOUNT] [MESSAGE]`,
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
		//Parsing returns NaN if NaN.
		args[0] = parseInt(args[0]);
        if (isNaN(args[0])) {
            message.reply('That doesn\'t seem to be a valid number. Canceling operation.')
				.then(errorMessage => errorMessage.delete({timeout: 9000})
					.catch(error => console.error(error)))
				.catch(networkError => console.error(networkError));
        } else if (perm(message, 1)) {
			let spamNumber;
			for (spamNumber = 1; spamNumber < args[0]; spamNumber++) {
				if (args[1] === undefined) {
					message.channel.send(spamNumber).catch(networkError => console.error(networkError));
				} else {
					message.channel.send(args[1]).catch(networkError => console.error(networkError));
				}
			}
			message.channel.send('Done!').catch(networkError => console.error(networkError));
			log(`Spammed ${spamNumber + 1} of messages.`);
        }
        message.delete().catch(error => console.error(error));
	},
};