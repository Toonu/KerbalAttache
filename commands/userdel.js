const {perm, messageHandler, report, log} = require('../utils');
const {prefix} = require('../database.json');

module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from the database.',
    args: 1,
    usage: `${prefix}userdel [USER]`,
    cooldown: 5,
    guildOnly: true,
    usesDB: true,
    execute: function userdel(message, args, db) {
        const discordUser = message.mentions.users.first();
        
        //Validating input arguments.
        if (!perm(message, 1)) {
            return message.delete().catch(error => log(error, true));
        } else if (!discordUser) {
            return messageHandler(message, new Error('InvalidArgumentException: No user specified, canceling operation.'), true)
        }
        
        //Deleting and reporting if user exists.
        if (db.removeUser(discordUser)) {
            db.export();
            report(message, `${message.author} deleted user ${discordUser}!`, this.name);
            messageHandler(message, 'User deleted.', true);
        } else {
            return messageHandler(message, new Error('NullReferenceException: User does not exist, canceling operation.'), true)
        }
    },
};
