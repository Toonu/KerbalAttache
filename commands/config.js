export const name = 'config';
export const description = 'Commands for configuring the bot! Do NOT use in public channels.';
export const args = true;
export const usage = '<M:configuration> <M:newValue>\nmoney, sheet, sname, smainid, sadminadd, sdevadd, sadmindel, sdevdel';
export const perms = 'Moderator';
export const cooldown = 5;
export const guildOnly = true;

/**
 * Function to configure the bot for specific server of the command message's guild.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Array} args      Arguments array of [String, String] with String configuration name and replacement data String.
 */
export function execute(message, args) {
    const cfg = require('./../config.json');
    const js = require('./../json');
    const fs = require('fs');

    if (js.perm(message, 2)) {
        if (!['money', 'sheet', 'sname'].includes(args[0])) {
            try {
                if (isNaN(parseInt(args[1])))
                    throw 'Not a proper ID/Number.';
            } catch (err) {
                console.error(err);
                return;
            }
        }

        switch (args[0]) {
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
                    message.reply('Not a number.');
                    return;
                }
                cfg.era = parseInt(args[1]);
                break;
            default:
                message.reply('Wrong configuration argument.');
                return;
        }

        js.exportFile('config.json', cfg);
        message.channel.send('Operation finished.');
    }
}