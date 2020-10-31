module.exports = {
    name: 'tech',
    description: 'Command for managing your research!',
    args: true,
    usage: 'WIP DO NOT USE YET <operation> <operation type> <operation data> <A:@user>\nPossible operations:\n**budget <set | add>** - sets or adds money to the research budget (use negative number to decrease).\n**research <node>** - researches specified tech tree node.\n**list <area>** - lists tech tree nodes of specified area.\n***List areas:***\nXXX',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")

        message.reply('There is nothing to see. Move along.');
        
        let nation = cfg.users[message.author.id].nation;
        if (args[2] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }

        switch(args[0]) {
            case 'budget':
                if(args[1] == 'set') {
                    budget(args, message, false);
                } else if (args[1] == 'add') {
                    budget(args, message, true);
                } else {
                    message.channel.send('Operation type provided does not exist!');
                    return;
                }
            case 'research':
                return;
            case 'list':
                return;
        }
    },   
};


function budget(args, message, add) {
    try {
        args[0] = parseInt(args[0]);
        if (isNaN(args[0])) throw 'Argument is not a number. Canceling operation.'

        let nation = cfg.users[message.author.id].nation;
        if (args[1] != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }
        add = add ? 1 : 0;
        console.log(add);

        gm.findUnitPrice('ResBudget', message, nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else {
                data[0] = parseInt(data[0].replace(/[,|$]/g, ''));
            }

            fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, parseInt(args[0]) * add], message)
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
}