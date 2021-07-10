module.exports = {
    name: 'config',
    description: 'Commands for configuring the bot! Do NOT use in public channels.',
    args: true,
    usage: '<M:configuration> <M:newValue>\nmoney, sheet, sname, smainid, sadminadd, sdevadd, sadmindel, sdevdel',
    perms: 'Moderator',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const cfg = require('./../config.json')
        const js = require('./../json');
        const fs = require('fs');

        if (js.perm(message, 2)) {
            if (!['money', 'sheet', 'sname'].includes(args[0])) {
                try {
                    if(isNaN(parseInt(args[1]))) throw 'Not a proper ID/Number.';
                } catch(err) {
                    console.error(err);
                    return;
                }
            }
            
            switch(args[0]) {
                case 'money':
                    cfg.money = args[1];
                    break;
                case 'sheet':
                    cfg.sheet = args[1];
                    break;
                case 'sname':
                    cfg.servers[message.guild.id].name = args[1];
                    break;
                case 'smainid':
                    cfg.servers[message.guild.id].main_channel = args[1];
                    break;
                case 'sadminadd':
                    cfg.servers[message.guild.id].administrators.push(args[1]);
                    break;
                case 'sdevadd':
                    cfg.servers[message.guild.id].developers.push(args[1]);
                    break;
                case 'sadmindel':
                    let adm = cfg.servers[message.guild.id].administrators;
                    for (i = 0; i < adm.length; i++) {
                        if (adm[i] == args[1]) {
                            adm.splice(i);
                            break;
                        }
                    }
                    break;
                case 'sdevdel':
                    let dev = cfg.servers[message.guild.id].developers;
                    for (i = 0; i < dev.length; i++) {
                        if (dev[i] == args[1]) {
                            dev.splice(i);
                            break;
                        }
                    }
                    break;
                case 'era':
                    if (isNaN(parseInt(args[1]))) {
                        message.reply('Not a number.')
                        return;
                    }
                    cfg.era = parseInt(args[1]);
                    break;
                default:
                    message.reply('Wrong configuration argument.')
                    return;
            }

            js.exportFile('config.json', cfg);
            message.channel.send('Operation finished.')
        }        
    }
};