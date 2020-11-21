const {perm} = require("../jsonManagement");
module.exports = {
	name: 'reload',
	description: 'Reloads a command.',
	args: true,
	guildOnly: true,
	execute: function reload(message, args) {
		if (!perm(message, 1)) return;

		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`).then(msg => msg.delete({timeout: 9000}));
			message.delete();
			return;
		}

		delete require.cache[require.resolve(`./${command.name}.js`)];

		try {
			const newCommand = require(`./${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			message.channel.send(`Command \`${command.name}\` was reloaded!`).then(msg => msg.delete({timeout: 9000}));
			message.delete();
		} catch (error) {
			console.error(error);
			message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``).then(msg => msg.delete({timeout: 9000}));
			message.delete();
		}
	},
};