// noinspection ReuseOfLocalVariableJS

const { prefix } = require('../config.json');

module.exports = {
	name: 'help',
	description: 'Lists all commands. If used with command name, writes information about specific command.',
	usage: `${prefix}help [COMMAND]`,
	args: 0,
	cooldown: 5,
	guildOnly: false,
	execute: function help(message, args) {

		const {commands} = message.client;
		let data = [];

		//Without a command argument.
		if (!args.length) {
			data.push('Here is a list of all my commands:', commands.map(command => command.name).join(', '),
			`You can use \`${prefix}help [COMMAND]\` to get info on a specific command.`,
			'Do not forget to avoid using command concerning your state in a public channels open to espionage!',
			'Refrain to using these commands in your private national channel please.',
			'The command arguments are enclosed in [] brackets, while their explanation usually comes in the command description.');

			return message.author.send(data, {split: true})
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.reply('I\'ve sent you a DM with all my commands!')
						.then(replyMessage => replyMessage.delete({timeout: 9000}).catch(error => console.error(error))
							.catch(networkError => console.error(networkError)));
					message.delete().catch(error => console.error(error));
				})
				.catch(error => {
					console.error(`Could not send help DM to <@${message.author.id}>.\n`, error.message);
					message.reply('It seems like I can\'t DM you!')
						.then(errorMessage => {
							message.channel.send(data)
								.then(replyMessage => replyMessage.delete({timeout: 12000}).catch(error => console.error(error))
									.catch(networkError => console.error(networkError)));
							errorMessage.delete({timeout: 9000}).catch(error => console.error(error))
								.catch(networkError => console.error(networkError))
						});
					message.delete().catch(error => console.error(error));
				});
		}

		//Verifying command and printing its help.
		const command = commands.get(args[0].toLowerCase());
		if (!command) {
			message.reply('That\'s not a valid command!')
				.then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error))
				.catch(networkError => console.error(networkError)));
			return message.delete().catch(error => console.error(error));
		} else {
			data.push(`**Name:** ${command.name}`);

			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${command.usage}`);

			message.channel.send(data)
				.then(helpMessage => helpMessage.delete({timeout: 32000}).catch(error => console.error(error))
					.catch(networkError => console.error(networkError)));
			message.delete().catch(error => console.error(error));
		}
	},
};