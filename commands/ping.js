export const name = 'ping';
export const description = 'Ping!';
export const guildOnly = true;

/**
 * Function for testing purposes.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args 		No arguments accepted.
 */
export function execute(message, args) {
	message.channel.send('Pong.');
}