module.exports = {
    name: 'tiles',
    description: 'Command for managing tile amount by adding/subtracting it!',
    args: false,
    usage: '[M:amount] [M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: async function tiles(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("../jsonManagement")

        //Checking arguments and permissions.
        let fail = false;
        if (!js.perm(message, 2, true)) {
            fail = true;
        } else if (args[0] === undefined) {
            message.channel.send('You can get information about amount of your tiles in ?balance.').then(msg => msg.delete({timeout: 12000}));
            fail = true;
        }
        args[0] = parseInt(args[0]);
        let user = message.mentions.users.first().id;
        if (isNaN(args[0])) {
            message.channel.send('Argument is not a number. Canceling operation.').then(msg => msg.delete({timeout: 12000}));
            fail = true;
        } else if (user === undefined) {
            message.channel.send('No user specified. Canceling operation.').then(msg => msg.delete({timeout: 12000}));
            fail = true;
        }

        if (fail) {
            message.delete({timeout: 12000});
            return;
        }

        gm.findUnitPrice('Tiles', message, cfg.users[user].nation)
        .then(tiles => {
            if (tiles[3] === false) {
                tiles[3] = 0;
            } else {
                tiles[3] = parseInt(tiles[3]);
            }
            //Checking whether the number of tiles would go into negative.
            if (parseInt(args[0]) + tiles[3] < 0) {
                message.channel.send('Tiles cannot go into negative numbers. Canceling operation.').then(msg => msg.delete({timeout: 12000}));
                message.delete({timeout: 12000});
                return;
            }
            //Setting new tile number.
            fn.ss(['set', `${fn.toCoord(tiles[1])+(tiles[2])}`, parseInt(args[0]) + tiles[3]], message)
            .then(() => {
                message.channel.send('Tiles set!').then(msg => msg.delete({timeout: 12000}));
                message.delete({timeout: 12000});
            })
        })
        .catch(err => console.error(err));
    },
};