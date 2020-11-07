export const name = 'userdel';
export const description = 'Command for deleting user from database!';
export const args = true;
export const usage = '<M:@user>';
export const perms = 'Moderator';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for deleting user from main configuration file.
 * @param {Message} message   Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [User].    
 */
export function execute(message, args) {
    const js = require('./../json');
    const cfg = require('./../config.json');

    var user = message.mentions.users.first();
    if (user == undefined) {
        message.channel.send('No user specified, please retry. ');
        return;
    }

    if (js.perm(message, 2)) {
        delete cfg.users[user.id];
        js.exportFile("config.json", cfg);
        message.channel.send("User deleted.");
    }
}
