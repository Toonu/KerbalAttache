const cfg = require('./../config.json'), {exportFile, perm, messageHandler, report} = require('../utils');
module.exports = {
    name: 'userdel',
    description: 'Command for deleting tagged user from the database.',
    args: 1,
    usage: `${cfg.prefix}userdel [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message) {
        const user = message.mentions.users.first();

        //Validation
        if (!user) {
            return messageHandler(message, new Error('InvalidArgumentException: No user specified, please retry.'), true)
        } else if (!cfg.users[user.id]) {
            return messageHandler(message, new Error('InvalidArgumentException: User does not exist, please retry.'), true)
        } else if (perm(message, 2)) {
            //Deleting the user and exporting the edited file.
            delete cfg.users[user.id];
            exportFile('config.json', cfg);
            //Logging
            report(message, `${message.author.nickname} deleted user <@${message.mentions.users.first().username}>!`, this.name);
            messageHandler(message, 'User deleted.', true);
        }
    }
};
