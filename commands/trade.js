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
        }

        let type = 'Sells';
        if (args[0] == '1') {
            type = 'Buys'
        }

        gm.findUnitPrice(type, message, nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else {
                data[0] = parseInt(data[0].replace(/[,|$]/g, ''));
            }
            fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, parseInt(args[1]) + data[0]], message)
            .then(result => {
                if (result) {
                    message.channel.send('Trade set!');
                } else {
                    message.channel.send('Operation failed!');
                }
            })
            
        })
        .catch(err => console.error(err));    
    },
};