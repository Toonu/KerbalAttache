export const name = 'reload';
export const description = 'Reloads a command.';
export const perms = 'Moderator';
export const args = true;

/**
 * Function reloads a command from files.
 * @param {Message} message 	Message to retrieve channel to interact with.
 * @param {String} args 		Arguments array of [String]. String command name specifies command to reload.
 */
export function execute(message, args) {
	const js = require('./../json');

	if (!js.perm(message, 2)) {
		return;
	}

	const commandName = args[0].toLowerCase();
	const command = message.client.commands.get(commandName)
		|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) {
		return message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
	}

	delete require.cache[require.resolve(`./${command.name}.js`)];

	try {
		const newCommand = require(`./${command.name}.js`);
		message.client.commands.set(newCommand.name, newCommand);
		message.channel.send(`Command \`${command.name}\` was reloaded!`);
	} catch (error) {
		console.error(error);
		message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
	}
}