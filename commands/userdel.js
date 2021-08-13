const cfg = require('./../config.json'), {perm, messageHandler, report, log} = require('../utils');
module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from the database.',
    args: 1,
    usage: `${cfg.prefix}userdel [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message, args, db) {
        const discordUser = message.mentions.users.first();
        
        //Validating input arguments.
        if (!discordUser) {
            return messageHandler(message, new Error('InvalidArgumentException: No user specified, please retry.'), true)
        } else if (!perm(message, 2)) {
            return message.delete().catch(error => log(error, true));
        }
        
        //Deleting and reporting if user exists.
        if (db.removeUser(discordUser)) {
            db.export();
            report(message, `${message.author.username} deleted user <@${discordUser.id}>!`, this.name);
            messageHandler(message, 'User deleted.', true);
        } else {
            return messageHandler(message, new Error('NullReferenceException: User does not exist, please retry.'), true)
        }
    }
};
