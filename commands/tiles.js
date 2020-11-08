const cfg = require("./../config.json"), {report, findUnitPrice} = require("../game"),
    {toCoordinate, ss} = require("../fn"), {perm} = require("../jsonManagement");
module.exports = {
    name: 'tiles',
    description: 'Command for managing tile amount by adding/subtracting it!',
    args: false,
    usage: '[M:amount] [M:@user]',
    cooldown: 5,
    guildOnly: true,
    execute: async function tiles(message, args) {


        //Checking arguments and permissions.
        let fail = false;
        if (!perm(message, 2, true)) {
            fail = true;
        } else if (args[0] === undefined) {
            message.channel.send('You can get information about amount of your tiles in ?balance.').then(msg => msg.delete({timeout: 9000}));
            fail = true;
        }
        args[0] = parseInt(args[0]);
        let user = message.mentions.users.first().id;
        if (isNaN(args[0])) {
            message.channel.send('Argument is not a number. Canceling operation.').then(msg => msg.delete({timeout: 9000}));
            fail = true;
        } else if (user === undefined) {
            message.channel.send('No user specified. Canceling operation.').then(msg => msg.delete({timeout: 9000}));
            fail = true;
        }

        if (fail) {
            message.delete();
            return;
        }

        findUnitPrice('Tiles', message, cfg.users[user].nation)
        .then(tiles => {
            if (tiles[3] === false) {
                tiles[3] = 0;
            } else {
                tiles[3] = parseInt(tiles[3]);
            }
            let newTiles = parseInt(args[0]) + tiles[3]
            //Checking whether the number of tiles would go into negative.
            if (newTiles >= 0) {
                ss(['set', `${toCoordinate(tiles[1]) + (tiles[2])}`, newTiles], message)
                    .then(() => {
                        message.channel.send('Tiles set!').then(msg => msg.delete({timeout: 9000}));
                        report(message, `Tiles set to ${newTiles} for ${cfg.users[user].nation} by ${message.author.username}!`)
                    })
            } else {
                message.channel.send('Tiles cannot go into negative numbers. Canceling operation.').then(msg => msg.delete({timeout: 9000}));
            }
            message.delete();
            //Setting new tile number.
        })
        .catch(err => console.error(err));
    },
};