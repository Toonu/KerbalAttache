module.exports = {
    name: 'userdel',
    description: 'Method for deleting user from database!',
    args: false,
    usage: '<user>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");

        if (!fn.perm(message, 2)) {
            const id = message.mentions.users.map(user => {
                return user.id;		
            });
            fn.delUser(id)
            message.channel.send("User deleted.")
        }
    }
};
