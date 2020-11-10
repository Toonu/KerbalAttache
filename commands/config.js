const {report} = require("../game");
module.exports = {
    name: 'config',
    description: 'Commands for configuring the bot settings.',
    args: true,
    usage: `[M:configuration] [M:newValue]
Configurations:
money, sheet, era, sname, smainid, sadminadd, sdevadd, sadmindel, sdevdel`,
    cooldown: 5,
    guildOnly: true,
    execute: function configBot(message, args) {
        const cfg = require('./../config.json')
        const js = require('../jsonManagement');

        if (js.perm(message, 2)) {
            if (!['money', 'sheet', 'sname'].includes(args[0]) && isNaN(parseInt(args[1]))) {
                message.channel.send('Not a proper ID/Number.').then(msg => msg.delete({timeout: 9000}));
                message.delete({timeout: 50});
                return;
            }

            if (args[0] === 'money') {
                cfg.money = args[1];
            } else if (args[0] === 'sheet') {
                cfg.sheet = args[1];
            } else if (args[0] === 'sname') {
                cfg.servers[message.guild.id].name = args[1];
            } else if (args[0] === 'smainid') {
                cfg.servers[message.guild.id].main_channel = args[1];
            } else if (args[0] === 'sadminadd') {
                // noinspection JSUnresolvedVariable
                cfg.servers[message.guild.id].administrators.push(args[1]);
            } else if (args[0] === 'sdevadd') {
                // noinspection JSUnresolvedVariable
                cfg.servers[message.guild.id].developers.push(args[1]);
            } else if (args[0] === 'sadmindel') {
                // noinspection JSUnresolvedVariable
                let adm = cfg.servers[message.guild.id].administrators;
                for (let i = 0; i < adm.length; i++) {
                    if (adm[i] === args[1]) {
                        adm.splice(i);
                        break;
                    }
                }
            } else if (args[0] === 'sdevdel') {
                // noinspection JSUnresolvedVariable
                let dev = cfg.servers[message.guild.id].developers;
                for (let i = 0; i < dev.length; i++) {
                    if (dev[i] === args[1]) {
                        dev.splice(i);
                        break;
                    }
                }
            } else if (args[0] === 'era') {
                cfg.era = parseInt(args[1]);
            } else {
                message.reply('Wrong configuration type argument.').then(msg => msg.delete({timeout: 9000}));
                message.delete({timeout: 9000});
                return;
            }

            js.exportFile('config.json', cfg);
            message.channel.send('Operation finished.').then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
            report(message, `${message.author.username} changed configuration ${args[0]} to ${args[1]}`, this.name);
        }
    }
};