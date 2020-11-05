module.exports = {
    name: 'map',
    description: 'Command for getting link to you map. Do NOT use in public channels.',
    args: false,
    usage: '<M:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json")
        const js = require('./../json');
        try {
            if (args[0] != undefined && js.perm(message, 2)) {
                message.channel.send(cfg.users[message.mentions.users.first().id].map);
            } else {
                message.channel.send(cfg.users[message.author.id].map);
            }
        } catch(err) {
            message.channel.send("No map assigned.")
        }
    }
}
