const {report} = require("../game"), {createUser, perm} = require("../jsonManagement");
module.exports = {
    name: 'usercreate',
    description: 'Command for creating user!',
    args: true,
    usage: '[M:@user] [M:nation] [M:color] [M:sheet] [M:map]',
    cooldown: 5,
    guildOnly: true,
    execute: function usercreate(message, args) {
        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry. ').then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
            return;
        }
        if (!perm(message, 1, true)) {
            report(message, `${createUser(user.id, args[1], args[2], args[3], args[4])} by ${message.author.username}`);
            message.channel.send("User created.").then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
        }
    }
};

