module.exports = {
    name: 'trade',
    description: 'Method for trading assets!',
    args: true,
    usage: '<type> <amountToAdd>\n0: sells / 1: buys',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")

        let nation = cfg.users[message.author.id].nation;
        if (args[2] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        } else if (args[0] != undefined) {
            return;
        }

        gm.findUnitPrice('Trade', message, nation)
        .then(data => {
            fn.ss(['get', `${fn.toCoord(data[1] + args[0]) + data[2]}`, 1, 0], message)
                .then(result => {
                    if (result == false) {
                        result = 0;
                    } else {
                        result = parseInt(result.replace(/[,|$]/g, ''));
                    }
                    fn.ss(['set', `${fn.toCoord(data[1] + args[0])+(data[2])}`, parseInt(args[1]) + result], message);
                    message.channel.send("Trade set!");
                })
                .catch(err => console.error(err));
        })
        .catch(err => console.error(err));        
    },
};