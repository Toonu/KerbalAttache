module.exports = {
    name: 'buy',
    description: 'Method for buying new assets!',
    args: true,
    usage: '<amount> <asset>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");

        gm.findUnitPrice(args[1].toUpperCase(), message)
        .then(result => {
            message.channel.send(`Do you want to buy ${args[0]} ${args[1]} for ${parseInt(result) * args[0]} [y]/[n]`);
            message.react('')
        })
        .catch(err => message.channel.send("Error in: " + err));
    },
};