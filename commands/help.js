// noinspection ReuseOfLocalVariableJS

const {prefix} = require('../database.json');
const {messageHandler, log} = require("../utils");

module.exports = {
	name: 'help',
	description: 'Command lists all commands. Used with command name writes command information.',
	usage: `${prefix}help [COMMAND]`,
	args: 0,
	cooldown: 5,
	guildOnly: false,
	execute: function help(message, args) {
		const {commands} = message.client;
		let data = [];

		//Without a command argument.
		if (!args.length) {
			data.push('Here is a list of all my commands:', `\`\`\`${commands.map(command => `${(command.name + ':').padEnd(12)} ${command.description}`).join('\n')}\`\`\``,
			`You can use \`${prefix}help [COMMAND]\` to get info on a specific command.`,
			'Do not forget to avoid using command concerning your state in a public channels open to espionage!',
			'Refrain to using these commands in your private national channel please.',
			'The command arguments are enclosed in [] brackets, while their explanation usually comes in the command description.');

			return message.author.send(data, {split: true})
				.then(() => {
					if (message.channel.type === 'dm') return;
					messageHandler(message, 'I\'ve sent you a DM with all my commands!', true);
				})
				.catch(error => {
					log(`Could not send help DM to <@${message.author.id}>.\n${error.message}\n${error.stack}`, true);
					messageHandler(message, 'It seems like I cannot DM you!\n\n' + data, true, 32000);
				});
		}

		//Verifying command and printing its help.
		const command = commands.get(args[0].toLowerCase());
		if (command) {
			data.push(`**Name:** ${command.name}`);
			
			if (command.description) data.push(`**Description:** ${command.description}`);
			if (command.usage) data.push(`**Usage:** ${command.usage}`);
			
			messageHandler(message, data, true, 32000);
		} else {
			messageHandler(message, new Error('InvalidArgumentException: That is not a valid command!'), true);
		}
	}
};