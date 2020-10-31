module.exports = {
    name: 'tiles',
    description: 'Method for increasing tile amount!',
    args: true,
    usage: '<user> <addition>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")

        if (args[2] == undefined && !js.perm(message, 2)) {
            return;
        }

        gm.findUnitPrice('Tiles', message, cfg.users[message.mentions.users.first().id].nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else {
                data[0] = parseInt(data[0]);
            }

            fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, parseInt(args[1]) + data[0]], message)
            .then(result => {
                if (result) {
                    message.channel.send('Tiles set!');
                } else {
                    message.channel.send('Operation failed!');
                }
            })
            
        })
        .catch(err => console.error(err));    
    },
};