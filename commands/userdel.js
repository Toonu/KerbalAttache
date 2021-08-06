const cfg = require('./../config.json'), {exportFile, perm, messageHandler, report} = require('../utils');
module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from the database.',
    args: 1,
    usage: `${cfg.prefix}userdel [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message) {

        //Validating input arguments.
        if (message.mentions.users.size === 0)
            return messageHandler(message, new Error('InvalidArgumentException: No user specified, please retry.'), true)
        const user = message.mentions.users.first();

        //Validation
        if (!cfg.users[user.id])
            return messageHandler(message, new Error('InvalidArgumentException: User does not exist, please retry.'), true)
        else if (perm(message, 2)) {
            //Deleting the user and exporting the edited file.
            delete cfg.users[user.id];
            exportFile('config.json', cfg);
            report(message, `${message.author.username} deleted user <@${user.id}>!`, this.name);
            messageHandler(message, 'User deleted.', true);
        }
    }
};
