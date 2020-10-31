module.exports = {
    name: 'userdel',
    description: 'Command for deleting user from database!',
    args: true,
    usage: '<A:@user>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');
        if (js.perm(message, 2)) {
            js.delUser(message.mentions.users.first());
            message.channel.send("User deleted.")
        }
    }
};
