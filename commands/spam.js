const {perm, messageHandler, log} = require("../utils"), {prefix} = require('../config.json');
module.exports = {
	name: 'spam',
	description: 'Command for spamming messages.',
	args: 1,
	usage: `${prefix}spam [AMOUNT] [MESSAGE]`,
	cooldown: 5,
	guildOnly: true,
	execute(message, args) {
		//Parsing returns NaN if NaN.
		args[0] = parseInt(args[0]);
        if (isNaN(args[0])) {
        	return messageHandler(message, new Error('InvalidTypeException: That does not seem to be a valid number. Canceling operation.'), true)
        } else if (perm(message, 1)) {
        	//Spamming
			let spamNumber;
			for (spamNumber = 1; spamNumber < args[0]; spamNumber++) {
				//Not using handler to not delete the message.
				if (!args[1]) {
					message.channel.send(spamNumber).catch(networkError => log(networkError, true));
				} else {
					message.channel.send(args[1]).catch(networkError => log(networkError, true));
				}
			}
			message.channel.send('Done!').catch(networkError => log(networkError, true));
			message.delete().catch(networkError => log(networkError, true));
			log(`Spammed ${spamNumber} of messages.`);
        }
	},
};