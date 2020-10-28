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

        //Checking input arguments.
        try {
            args[0] = parseInt(args[0]);
            if (args[1] == undefined) throw "Missing second argument."
        } catch(err) {
            message.channel.send(`Wrong number input. See ${cfg.prefix}help buy for more information. ` + err);
            return;
        }
        
        var origin = message;

        gm.findUnitPrice(args[1].toUpperCase(), message)
        .then(result => {
            message.channel.send(`Do you want to buy ${args[0]} ${args[1]} for ${(parseInt(result) * args[0]).toLocaleString()}€ [y]/[n]`)
                .then(function (message) {
                    message.react('✅');
                    message.react('❌');
                    message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                        .then(collected => {
                            react = collected.first();
                            if (react.emoji.name == '✅') {
                                message.delete();
                                message.channel.send('Purchasing assets. ✅');
                                /*gm.findVertical(cfg.users[origin.author.id].nation, 'A', origin)
                                .then(row => {
                                    gm.findHorizontal(args[1].toUpperCase(), row ,origin)
                                        .then(column => {
                                            fn.ss(['get', `${String.fromCharCode(column)}${prices}`], message)
                                                .then(res => {
                                                    fn.ss(['set', `${column+row}`, res + args[0]], message)
                                                    .then(res => 
                                                    {
                                                        gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${args[1]} for ${(parseInt(result) * args[0]).toLocaleString()}€`);
                                                    })
                                                })
                                                .catch(err => reject(err));
                                        })
                                        .catch(err => reject(err));
                                })
                                .catch(err => reject('Operation error' + err));*/
                            } else {
                                message.delete();
                                message.channel.send('Operation was canceled. ❌');
                            }
                        })
                        .catch(collected => {
                            message.delete();
                            message.channel.send(`Operation was canceled after one minute.`);
                        })
                })
                .catch(err => message.channel.send('Error in: ' + err));
        })
        .catch(err => 'Error, please retry the acquisiton.' + err);
    }
};