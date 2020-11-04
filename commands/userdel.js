module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from database!',
    args: true,
    usage: '<A:@user>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');
        const cfg = require('./../config.json');

        if (js.perm(message, 2)) {
            delete cfg.users[message.mentions.users.first().id];
            js.exportFile("config.json", cfg);
            message.channel.send("User deleted.")
        }
    }
};
