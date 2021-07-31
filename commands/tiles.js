const cfg = require("./../config.json"), {report, findData} = require("../game"),
    {set} = require("../sheet"), {perm, ping} = require("../utils");
module.exports = {
    name: 'tiles',
    description: 'Command for managing tile amount of nation.',
    args: false,
    usage: '[M:amount] [M:@user] (use negative amount to remove tiles)',
    cooldown: 5,
    guildOnly: true,
    execute: async function tiles(message, args) {
        let user = ping(message).id;

        //Checking arguments and permissions.
        let fail = false;
        if (!perm(message, 2, true)) {
            fail = true;
        } else if (args[0] === undefined) {
            message.channel.send(`You can get information about amount of your tiles in ${cfg.prefix}balance.`).then(msg => msg.delete({timeout: 9000}));
            fail = true;
        }
        args[0] = parseFloat(args[0]);
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

        findData('Tiles', cfg.users[user].nation)
        .then(tiles => {
            if (tiles[3] === false) {
                tiles[3] = 0;
            } else {
                tiles[3] = tiles[3];
            }
            let newTiles = parseFloat(args[0]) + tiles[3]
            //Checking whether the number of tiles would go into negative.
            if (newTiles >= 0) {
                set(`${tiles[1] + tiles[2]}`, newTiles)
                    .then(() => {
                        message.channel.send('Tiles set!').then(msg => msg.delete({timeout: 9000}));
                        message.delete();
                        report(message, `Tiles set to ${newTiles} for ${cfg.users[user].nation} by <@${message.author.id}>!`, this.name)
                    })
            } else {
                message.channel.send('Tiles cannot go into negative numbers. Canceling operation.').then(msg => msg.delete({timeout: 9000}));
                message.delete();
            }
        })
        .catch(err => console.error(err));
    },
};