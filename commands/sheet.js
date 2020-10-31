module.exports = {
    name: 'sheet',
    description: 'Command for getting data from spreadsheet! Alternatively sends link to your own personal sheet which would be deprecated after removal of the private sheets.\nDo NOT use in public channels.',
    args: false,
    usage: '<D:operation> <x> <y> <cols> <rows> <tab>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {   
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const js = require('./../json');
        if (args[0] == undefined) {
            message.reply(`https://docs.google.com/spreadsheets/d/${cfg.users[message.author.id].sheet}/edit#gid=0`);
        } else if (args[0].startsWith('@') && js.perm(message, 1)) {
            message.channel.send(`https://docs.google.com/spreadsheets/d/${cfg.users[message.mentions.users.first()].sheet}/edit#gid=0`);
        } else if (js.perm(message, 1)) {
            fn.ss(args, message)
                .then(result => {
                    if (result) {
                        message.channel.send("Operation successful.");
                    } else {
                        message.channel.send("Result: " + result);
                    }                
                })
                .catch(err => message.channel.send("Result: " + err));
        }
    }
}
