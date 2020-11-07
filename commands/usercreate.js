export const name = 'usercreate';
export const description = 'Command for creating user!';
export const args = true;
export const usage = '<M:@user> <M:nation> <M:color> <M:sheet> <M:map>';
export const perms = 'Moderator';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function for creating new user and exporting him to the configuration file.
 * @param {Message} message   Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [User, String, String, String, String].
 */
export function execute(message, args) {
    const js = require('./../json');

    var user = message.mentions.users.first();
    if (user == undefined) {
        message.channel.send('No user specified, please retry. ');
        return;
    }

    if (js.perm(message, 1) && js.createUser(user.id, args[1], args[2], args[3], args[4])) {
        message.channel.send("User created.");
        return;
    }
    message.channel.send("User creation failed.");
}

