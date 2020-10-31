module.exports = {
    name: 'usercreate',
    description: 'Command for creating user!',
    args: true,
    usage: '<A:@user> <A:nation> <A:color> <A:pwd> <A:sheet> <A:map>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');

        if (js.perm(message, 1) && js.cre3ateUser(message, args[1], args[2], args[3], args[4], args[5])) {
            message.channel.send("User created.")
            return;
        }
        message.channel.send("User creation failed.")
    }
};

