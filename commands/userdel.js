module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from database!',
    args: true,
    usage: '<M:@user>',
    perms: 'Moderator',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');
        const cfg = require('./../config.json');

        var user = message.mentions.users.first();
        if(user == undefined) {
            message.channel.send('No user specified, please retry. ');
            return;
        }

        if (js.perm(message, 2)) {
            delete cfg.users[user.id];
            js.exportFile("config.json", cfg);
            message.channel.send("User deleted.")
        }
    }
};
