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
            if (args[5] == undefined) {
                var tab = "Maintenance";
            } else {
                var tab = args[5];
            }
            var result = await fn.ss(args, message, true, tab)
            message.channel.send("Is" + result)
            return;
            }
        }
    }
