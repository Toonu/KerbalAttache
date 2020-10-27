module.exports = {
    name: 'sheet',
    description: 'Method for getting data from spreadsheet!',
    args: false,
    usage: '<arg> <x> <y> <cols> <rows> <sh>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) {   
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        if (fn.perm(message, 1)) {
            var result = await fn.ss(args, message);
            if (result == true) {
                message.channel.send("Operation was successful.");
            } else if (result == false) {
                message.channel.send("Operation failed.");
            } else {
                message.channel.send("Result: " + result);
            }
        }
    }
}
