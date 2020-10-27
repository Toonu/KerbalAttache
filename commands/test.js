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

        message.channel.send(await gm.findUnitPrice("MBT", message).catch(err => message.channel.send("Error in: " + err)));
    },
};