module.exports = {
    name: 'sheet',
    description: 'Method for getting data from spreadsheet!',
    args: true,
    usage: '<arg> <x> <y> <cols> <rows> <sh>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const js = require('./../json');
        if (js.perm(message, 1)) {
            fn.ss(args, message)
            .then(result => {
                if (result == true) {
                    message.channel.send("Operation successful.");
                } else {
                    message.channel.send("Result: " + result);
                }                
            })
            .catch(err => message.channel.send("Result: " + err));
        }
    }
}
