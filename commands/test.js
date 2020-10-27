module.exports = {
    name: 'test',
    description: 'Method for testing latest projects!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");

        gm.findUnitPrice(args[0].toUpperCase(), message)
        .then(result => {
            message.channel.send(result);
        })
        .catch(err => message.channel.send("Error in: " + err));
    },
};