export const name = 'test';
export const description = 'Command for testing latest projects!';
export const args = false;
export const usage = '<args>';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for testing purposes.
 * @param {Message} message   Message to retrieve channel to interact with.
 * @param {Array} args      Arguments.
 */
export async function execute(message, args) {
    message.reply('There is nothing to see. Move along.');
}