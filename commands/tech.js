module.exports = {
    name: 'tech',
    description: 'Command for managing your research!',
    args: true,
    usage: '<operation> <> <A:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")

        let nation = cfg.users[message.author.id].nation;
        if (args[2] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }

        gm.findUnitPrice('ResBudget', message, nation)
        .then(data => {
            fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, parseInt(args[0])], message)
            .then(result => {
                if (result) {
                    message.channel.send('Research budget set!');
                } else {
                    message.channel.send('Operation failed!');
                }
            })
            .catch(err => console.error(err));  
        })
        .catch(err => console.error(err));  
    },   
};