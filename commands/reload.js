const {perm} = require("../utils"), {prefix} = require("../config.json"), {log} = require("../game");
module.exports = {
	name: 'reload',
	description: 'Reloads the specified command.',
	usage: `${prefix}reload [COMMAND]`,
	args: 1,
	guildOnly: true,
	execute: function reload(message, args) {
		if (!perm(message, 1)) return;

		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			message.channel.send(`There is no command with name \`${commandName}\`, ${message.author}!`)
				.then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
				.catch(networkError => console.error(networkError));
			return message.delete().catch(error => console.error(error));
		}

		delete require.cache[require.resolve(`./${command.name}.js`)];

		try {
			const newCommand = require(`./${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			log(`Command \`${command.name}\` was reloaded!`);
			message.channel.send(`Command \`${command.name}\` was reloaded!`)
				.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
				.catch(networkError => console.error(networkError));
		} catch (error) {
			console.error(error);
			message.channel.send(`There was an error while reloading the command \`${command.name}\`:
			\`\`\`${error.message}\`\`\``)
				.then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
				.catch(networkError => console.error(networkError));
		} finally {
			message.delete().catch(error => console.error(error));
		}
	},
};