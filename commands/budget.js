module.exports = {
    name: 'budget',
    description: 'Command for setting your research budget! Do NOT use in public channels.',
    args: true,
    usage: '<money> <A:@user>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")

        try {
            args[0] = parseInt(args[0]);
            if (isNaN(args[0])) throw 'Argument is not a number. Canceling operation.'

            let nation = cfg.users[message.author.id].nation;
            if (args[1] != undefined && js.perm(message, 2)) {
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
        } catch(err) {
            message.channel.send(err);
        }
    },
};