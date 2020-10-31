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

        let col;
        let row;
        
        if (js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        } else if (args[0] != undefined) {
            return;
        }

        gm.findHorizontal('Tiles', 1, message)
            .then(res => {
                col = res;
                gm.findVertical(nation, 'A', message)
                    .then(r => {
                        row = parseInt(r);
                        fn.ss(['getA', `${fn.toCoord(col)}1`, `${fn.toCoord(col)+row}`, 1, 0], message)
                            .then(array => {
                                fn.ss(['get', `${fn.toCoord(col)+(row)}`,], message)
                                .then(result => {
                                    if (result == false) {
                                        result = 0;
                                    } else {
                                        result = parseInt(result);
                                    }
                                    fn.ss(['set', `${fn.toCoord(col)+(row)}`, parseInt(args[1]) + result], message);
                                })
                                .catch(err => console.log(err));
                                message.channel.send("Tiles set!")
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    },
};