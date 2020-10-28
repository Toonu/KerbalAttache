module.exports = {
    name: 'sheet',
    description: 'Method for getting data from spreadsheet!',
    args: false,
    usage: '<arg> <x> <y> <cols> <rows> <sh>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        if (fn.perm(message, 1)) {
            fn.ss(args, message)
            .then(result => {
                if (result == true) {
                    message.channel.send("Operation was successful.");
                } else if (result == false) {
                    message.channel.send("Operation failed.");
                }
            })
            .catch(err => message.channel.send("Result: " + err));
        }
    }
}
