export const name = 'prune';
export const usage = '<M:amountToDelete> <M:deleteOldMessages [true | false]>';
export const description = 'Prune messages from channel.';
export const guildOnly = true;
export const args = true;
export const perms = 'Moderator';
export const cooldown = 5;

/**
 * Function to delete messages from the channel of the command's message.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [Number, String]. Number amount messages to delete and String bool enabling deletion of older messages.
 */
export function execute(message, args) {
    try {
        if (!js.perms(message, 2)) throw ' ';
        let amount = parseInt(args[0]);
        if (isNaN(amount)) throw 'That doesn\'t seem to be a valid number. Canceling operation.';
        let bool = false;
        if (args[1] === "true") bool = true;

        message.channel.bulkDelete(amount, bool);
        console.log(`Deleted ${amount}`);
    } catch (err) {
        message.channel.send(err);
    }
}