module.exports = {
    name: 'budget',
    description: 'Method for setting your research budget!',
    args: true,
    usage: '<money>',
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
        
        if (args[1] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }

        gm.findHorizontal('Research', 1, message)
            .then(res => {
                col = res + 1;
                gm.findVertical(nation, 'A', message)
                    .then(r => {
                        row = parseInt(r);
                        fn.ss(['set', `${fn.toCoord(col)+row}`, parseInt(args[0])], message);
                        message.channel.send("Budget set!")
                    })
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    },
};