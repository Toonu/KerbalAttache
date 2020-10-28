module.exports = {
    name: 'buy',
    description: 'Method for buying new assets!',
    args: true,
    usage: '<amount> <asset>',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) { 
        const cfg = require('./../config.json')
        const fn = require('./../fn');
        const gm = require('./../game');

        const filter = (reaction, user) => {
	        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };

        //Easter egg, part one, carrts can be obtained from userinfo.
        if (message.mentions.users.first().id === '693908421396922480') {
            message.reply("You need carrots first.");
            return;
        }

        //Checking input arguments.
        try {
            args[0] = parseInt(args[0]);
            if (args[1] == undefined) throw "Missing second argument."
        } catch(err) {
            message.channel.send(`Wrong number input. See ${cfg.prefix}help buy for more information. ` + err);
            return;
        }
        
        var origin = message;
        var searchRow;

        gm.findUnitPrice(args[1].toUpperCase(), message)
        .then(result => {
            console.log(result);
            message.channel.send(`Do you want to buy ${args[0]} ${args[1]} for ${(parseInt(result) * args[0]).toLocaleString()}€ [y]/[n]`)
            .then(function (message) {
                message.react("✅");
                message.react("❌");
                message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    react = collected.first();
                    if (react.emoji.name == '✅') {
                        message.delete();
                        message.channel.send('Purchasing assets. ✅');
                        gm.findVertical(cfg.users[origin.author.id].nation, 'A', origin)
                        .then(row => {
                            searchRow = row;
                            gm.findHorizontal(args[1].toUpperCase(), 4, origin)
                            .then(col => {
                                fn.ss(['get', `${String.fromCharCode(col)+searchRow}`], message)
                                .then(res => {
                                    if (!res) {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, args[0]], message);
                                    } else {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, parseInt(res) + args[0]], message);
                                    }
                                    gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${args[1]} for ${(parseInt(result) * args[0]).toLocaleString()}€`);
                                })
                                .catch(err => message.channel.send(err));
                            })
                            .catch(err => message.channel.send(err));
                        })
                        .catch(err => {
                            message.channel.send(err);
                        });
                    } else {
                        message.delete();
                        message.channel.send('Operation was canceled. ❌');
                    }
                })
                .catch(err => console.error(`Operation was canceled after one minute. Err: ` + err));
            })
            .catch(err => console.error('Error, please retry the acquisiton.' + err));
        })
        .catch(err => console.error(err));
    }
};
