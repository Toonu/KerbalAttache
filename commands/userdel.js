module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from database!',
    args: true,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message) {
        const js = require('../jsonManagement');
        const cfg = require('./../config.json');

        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry.').then(msg => msg.delete({timeout: 12000}));
            message.delete({timeout: 12000});
            return;
        }
        if (!js.perm(message, 2, true)) {
            delete cfg.users[user.id];
            js.exportFile("config.json", cfg);
            message.channel.send("User deleted.").then(msg => msg.delete({timeout: 12000}));
            message.delete({timeout: 12000});
        }
    }
};
