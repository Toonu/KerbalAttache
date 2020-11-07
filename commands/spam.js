export const name = 'spam';
export const description = 'Command for sending messages.';
export const args = true;
export const usage = '<D:amount>';
export const perms = 'Developer';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for spamming messages into the command message's channel.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args      No arguments accepted.
 */
export function execute(message, args) {
    const js = require('./../json');

    try {
        args[0] = parseInt(args[0]);
        if (isNaN(args[0])) {
            return message.reply('that doesn\'t seem to be a valid number. Canceling operation.');
        }
    } catch (err) {
        message.channel.send(err);
        return;
    }

    if (js.perm(message, 1)) {
        message.delete();
        for (var i = 0; i < parseInt(args[0] - 1); i++) {
            message.channel.send('Pong.');
        }
        message.channel.send('Done!');
    }
}