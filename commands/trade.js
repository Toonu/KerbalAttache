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
        let col;
        let row;
        
        if (args[2] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }
        let offset = parseInt(args[0]);
        gm.findHorizontal('Trade', 1, message)
            .then(res => {
                col = res;
                gm.findVertical(nation, 'A', message)
                    .then(r => {
                        row = parseInt(r);
                        fn.ss(['getA', `${fn.toCoord(col)}1`, `${fn.toCoord(col)+row}`, 1, 0], message)
                            .then(array => {
                                fn.ss(['get', `${fn.toCoord(col+ offset)+(row)}`,], message)
                                .then(result => {
                                    fn.ss(['set', `${fn.toCoord(col+ offset)+(row)}`, parseInt(args[1]) + parseInt(result.replace(/[,|$]/g, ''))], message);
                                })
                                .catch(err => console.log(err));
                                message.channel.send("Trade set!")
                            })
                            .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    },
};