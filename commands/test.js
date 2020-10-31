module.exports = {
    name: 'test',
    description: 'Method for testing latest projects!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) { 
        const cfg = require('./../config.json');
        const units = require('./../units.json');
        const js = require('./../json');
        const fn = require('./../fn');
        const gm = require('./../game');
        const Discord = require('discord.js');

        const filter = (reaction, user) => {
	        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        };

        try {
            //Easter egg, part one, carrts can be obtained from userinfo.
            if (message.mentions.users.first().id === '693908421396922480' && cfg.users[message.author.id].egg == 'carrot') {
                message.channel.send('Owned');
                return;
            } else if (message.mentions.users.first().id === '693908421396922480') {
                message.reply("You need carrots first.");
                return;
            } 
        } catch(err) {
            if (args[1].startsWith('carrot')) {
                js.modifyUser(message, message.author.id, 0, "carrot");
                message.reply('Carrot found.')
                return;  
            }
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

        if (!units.wpAerial.hasOwnProperty(args[1]) || !units.wpSurface.hasOwnProperty(args[1]) || !units.system.hasOwnProperty(args[1])) {

        

        gm.findUnitPrice(args[1].toUpperCase(), message, cfg.users[message.author.id].nation)
        .then(result => {
            //console.log(result);

            let vehicle;
            switch(args[1]) {
                case "L":
                    vehicle = 'Light Multirole Airframe';
                    break;
                case "M":
                    vehicle = 'Medium Multirole Airframe';
                    break;
                case "H":
                    vehicle = 'Heavy Multirole Airframe';
                    break;
                case "LA":
                    vehicle = 'Large Airframe';
                    break;
                case "VL":
                    vehicle = 'Very Large Airframe';
                    break;
                case "VTOL":
                    vehicle = 'Helicopter / VTOL Airframe';
                    break;
                case "K":
                    vehicle = 'Corvette';
                    break;
                case "FF":
                    vehicle = 'Frigate';
                    break;
                case "DD":
                    vehicle = 'Destroyer';
                    break;
                case 'CC':
                    vehicle = 'Cruiser';
                    break;
                case 'BC':
                    vehicle = 'Battlecruiser';
                    break;
                case 'BB':
                    vehicle = 'Battleship';
                    break;
                case 'CV':
                    vehicle = 'Fleet Carrier';
                    break;
                case 'CL':
                    vehicle = 'Light Carrier';
                    break;
                case 'SAT':
                    vehicle = 'Satellite';
                    break;
                case 'OV':
                    vehicle = 'Orbital Vehicle';
                    break;
                case 'SF':
                    vehicle = 'Special Operation Forces';
                    break;
                default:
                    vehicle = args[1];
            }

            let cost = (parseInt(result) * args[0] * 4);
            const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Office of Aquisitions`)
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Amount:', value: args[0], inline: true},
                { name: 'Asset', value: vehicle, inline: true},
                { name: 'Cost:', value: cost.toLocaleString() + cfg.money},
                { name: 'Do you accept the terms of the supplier agreement?', value: '✅/❌'},
                { name: '\u200B', value: '\u200B'},
            )
            .setFooter('Made by the Attaché to the United Nations', 'https://imgur.com/KLLkY2J.png');

            message.channel.send(embed)
            .then(function (message) {
                message.react("✅");
                message.react("❌");
                //Reacting to the embed.
                message.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    react = collected.first();
                    if (react.emoji.name == '✅') {
                        //Accepted, deleting embed and writing response.
                        message.delete();
                        message.channel.send('Purchasing assets. ✅');
                        //Finding national row
                        gm.findVertical(cfg.users[origin.author.id].nation, 'A', origin)
                        .then(row => {
                            searchRow = row;
                            //Finding unit name column.
                            gm.findHorizontal(args[1].toUpperCase(), 4, origin)
                            .then(col => {
                                //Getting amount of current units + adding new.
                                fn.ss(['get', `${String.fromCharCode(col)+searchRow}`], message)
                                .then(res => {
                                    //Setting new num of units and commenting.
                                    if (!res) {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, args[0]], message);
                                    } else {
                                        fn.ss(['set', `${String.fromCharCode(col)+searchRow}`, parseInt(res) + args[0]], message);
                                    }
                                    if (cost < 0) {
                                        gm.report(origin, `${cfg.users[origin.author.id].nation} has sold ${Math.abs(args[0])} ${args[1]} for ${(Math.abs(cost)).toLocaleString() + cfg.money}`);
                                    } else {
                                        gm.report(origin, `${cfg.users[origin.author.id].nation} has bought ${args[0]} ${args[1]} for ${cost.toLocaleString() + cfg.money}`);
                                    }
                                })
                                .catch(err => message.channel.send(err));
                            })
                            .then(res => {
                                fn.ss(['get', `B${searchRow}`], message)
                                .then(money => {
                                    fn.ss(['set', `B${searchRow}`, (parseInt(money.replace(/[,|$]/g, '')) - cost)], message);
                                })
                            })
                            .catch(err => message.channel.send(err));

                        })
                        .catch(err => message.channel.send(err));
                    } else {
                        message.delete();
                        message.channel.send('Operation was canceled. ❌');
                    }
                })
                .catch(err => {
                    message.delete();
                    message.channel.send('Operation was canceled due to not responding. ❌');
                });
            })
            .catch(err => {
                console.error('Error, please retry the acquisiton.' + err);
            });
        })
        .catch(err => console.error(err));

        } else {
            //Weapon buying part

            let roww;
            gm.findVertical(cfg.users[origin.author.id].nation, 'A', message, 'Stockpiles')
                .then(row => {
                    roww = row;
                    gm.findHorizontal(args[1], 4, message, 'Stockpiles')
                        .then(col => {
                            fn.ss(['get', `${fn.toCoord(col)+parseInt(nat)}`], message, 'Stockpiles')
                                .then(result => {
                                    console.log(result);
                                    if (result == false) {
                                        result = 0;
                                    } else {
                                        result = parseInt(result);
                                    }
                                    fn.ss(['set', `${fn.toCoord(col)+nat}`, result + args[0]], message, 'Stockpiles')
                                    message.channel.send("Weapon bought.")
                                })
                                .catch(err => message.channel.send(err));
                        })
                        .catch(err => message.channel.send(err));
                })
                .catch(err => message.channel.send(err));
        }
    }
};