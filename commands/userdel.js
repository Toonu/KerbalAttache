module.exports = {
    name: 'userdel',
    description: 'Method for deleting user from database!',
    args: true,
    usage: '<user>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');
        if (js.perm(message, 2)) {
            const id = message.mentions.users.first();
            console.log(id);
            js.delUser(id)
            message.channel.send("User deleted.")
        }
    }
};
