module.exports = {
    name: 'sheet',
    description: 'Method for getting data from spreadsheet!\nBy typing only the command, you can get link to your private sheet. Do NOT use in public channels.',
    args: false,
    usage: '<arg> <x> <y> <cols> <rows> <sh>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const js = require('./../json');
        if (args[0] == undefined) {
            message.reply(`https://docs.google.com/spreadsheets/d/${cfg.users[message.author.id].sheet}/edit#gid=0`);
        } else if (js.perm(message, 1)) {
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
