const cfg = require('./../config.json'), {exportFile, perm} = require("../jsonManagement"), {report} = require("../game");
module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from database.',
    args: true,
    usage: '[M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message) {
        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry.').then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 12000});
            return;
        }
        if (perm(message, 2, true)) {
            delete cfg.users[user.id];
            exportFile("config.json", cfg);
            report(message, `${message.author.username} deleted user ${message.mentions.users.first().username}!`, this.name);
            message.channel.send("User deleted.").then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
        }
    }
};
