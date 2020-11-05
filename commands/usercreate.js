module.exports = {
    name: 'usercreate',
    description: 'Command for creating user!',
    args: true,
    usage: '<M:@user> <M:nation> <M:color> <M:pwd> <M:sheet> <M:map>',
    perms: 'Moderator',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');

        var user = message.mentions.users.first();
        if(user == undefined) {
            message.channel.send('No user specified, please retry. ');
            return;
        }

        if (js.perm(message, 1) && js.createUser(user.id, args[1], args[2], args[3], args[4], args[5])) {
            message.channel.send("User created.");
            return;
        }
        message.channel.send("User creation failed.");
    }
};

