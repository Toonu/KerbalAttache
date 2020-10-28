module.exports = {
    name: 'usercreate',
    description: 'Method for creating user!',
    args: false,
    usage: '<user> <nation> <color> <pwd>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const cfg = require("./../config.json")
        const js = require('./../json');

        if (js.perm(message, 2)) {
            const id = message.mentions.users.map(user => {
                return user.id;		
            });
    
            if (js.createUser(message, args[1], args[2], args[3])) {
                message.channel.send("User created.")
                return;
            }
            message.channel.send("Creation failed.")
        }
    }
};
