export const name = 'tiles';
export const description = 'Command for managing tile amount by adding/substracting it!';
export const args = false;
export const usage = '<amount> <M:@user>';
export const perms = 'Moderator';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for manipulating nation's tile amount.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [Number, User]. Number amount of tiles to add for User.
 */
export async function execute(message, args) {
    const cfg = require("./../config.json");
    const fn = require("./../fn");
    const gm = require("./../game");
    const js = require("./../json");

    try {
        if (args[0] == undefined) {
            message.channel.send('You can get information about amount of your tiles in ?balance.');
            return;
        }
        args[0] = parseInt(args[0]);
        if (!js.perm(message, 2) && args[1] != undefined) { return; }
        if (isNaN(args[0]))
            throw 'Argument is not a number. Canceling operation.';
    } catch (err) {
        message.channel.send(err);
        return;
    }

    gm.findUnitPrice('Tiles', message, cfg.users[message.mentions.users.first().id].nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else {
                data[0] = parseInt(data[0]);
            }

            fn.ss(['set', `${fn.toCoord(data[1]) + (data[2])}`, parseInt(args[1]) + data[0]], message)
                .then(result => {
                    if (result) {
                        message.channel.send('Tiles set!');
                    } else {
                        message.channel.send('Operation failed!');
                    }
                });

        })
        .catch(err => console.error(err));
}