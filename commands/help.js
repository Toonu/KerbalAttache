import { prefix } from '../config.json';

export const name = 'help';
export const description = 'Lists all of my commands or info about a specific command.';
export const usage = '<command name>';
export const cooldown = 5;

/**
 * Function prints out command configuration or all commands if no command is specified.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args 		Arguments array of [String]. String command name to print help of.
 */
export function execute(message, args) {
	const data = [];
	const { commands } = message.client;

	if (!args.length) {
		data.push('Here\'s a list of all my commands:');
		data.push(commands.map(command => command.name).join(', '));
		data.push(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command!`);
		data.push('Do not forget to NOT use commands about your state in public channels where everyone can espionage the values! Refrain to using them in state hidden channel please.');
		data.push('\nThe command arguments marked with M or D are available only for the moderators or developers. This does not mean you cannot use them at all without the specifically marked arguments. If the whole command is off-limits it is marked as such with perms tag.');

		return message.author.send(data, { split: true })
			.then(() => {
				if (message.channel.type === 'dm')
					return;
				message.reply('I\'ve sent you a DM with all my commands!');
			})
			.catch(error => {
				console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
				message.reply('it seems like I can\'t DM you!');
			});
	}

	const name = args[0].toLowerCase();
	const command = commands.get(name);

	if (!command) {
		return message.reply('that\'s not a valid command!');
	}

	data.push(`**Name:** ${command.name}`);

	if (command.description)
		data.push(`**Description:** ${command.description}`);
	if (command.usage)
		data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);
	if (command.perms)
		data.push(`**Permissions:** ${command.perms}`);

	data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

	message.channel.send(data, { split: true });
}