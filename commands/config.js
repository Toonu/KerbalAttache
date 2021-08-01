const {report} = require("../game"), cfg = require('../config.json'), js = require('../utils');
module.exports = {
    name: 'config',
    description: 'Commands for configuring the bot settings. Write del instead of the value to remove the role value.',
    args: 2,
    usage: `${cfg.prefix}config [OPTION] [VALUE] [DEL]
OPTIONS:
\`\`\`
money       STRING  (Currency code such as EUR/USD string.)
moneyLocale STRING  (Currency formatting such as fr-FR string.)
sheet       STRING  (Sheet ID string.)
era         INT     (Decimal integer, such as 50.)
sname       STRING  (Server internal name string.)
smainid     INT     (Server main announcements channel ID integer.)
sbattleid   INT     (Server battle announcements channel ID integer.)
sadmin      INT DEL (Server administrator roles integer.)
sdev        INT DEL (Server developer roles integer.)
sheadofstateSTRING  (Server Head of State role string.)
main        STRING  (Sheet main tab string.)
submissions STRING  (Sheet submissions tab string.)
systems     STRING  (Sheet systems tab string.)
\`\`\`
`,
    cooldown: 5,
    guildOnly: true,
    execute: function configBot(message, args) {
        if (js.perm(message, 2)) {
            if (!['money', 'sheet', 'sname', 'submissions', 'main', 'systems', 'moneyLocale', 'sheadofstate'].includes(args[0]) && isNaN(parseInt(args[1]))) {
                message.channel.send('Not a proper ID/Number.')
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
                return message.delete({timeout: 50}).catch(error => console.error(error));
            } else if (args[0] === 'era') {
                args[1] = parseInt(args[1]);
                if (args[1] % 10 !== 0) {
                    message.channel.send('Era must have zero at the end. Eg. 50, 60...')
                        .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                        .catch(networkError => console.error(networkError));
                    return message.delete({timeout: 50}).catch(error => console.error(error));
                }
            } else if (args[0] === 'money') {
                if (!new RegExp(/[A-Z]{3}/g).test(args[1])) {
                    message.channel.send('Money must be using their abbreviation, not a symbol. Eg. EUR, USD...')
                        .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                        .catch(networkError => console.error(networkError));
                    return message.delete({timeout: 50}).catch(error => console.error(error));
                }
            }

            switch (args[0]) {
                case 'money':
                case 'sheet':
                case 'era':
                case 'moneyLocale':
                case 'submissions':
                case 'main':
                case 'systems':
                    cfg[args[0]] = args[1];
                    break;
                case 'sname':
                case 'smainid':
                case 'sbattleid':
                case 'sheadofstate':
                    cfg.servers[message.guild.id][args[0].substring(1)] = args[1];
                    break;
                case 'sadmin':
                case 'sdev':
                    //del is not undefined and is del
                    let del = (args[2] && args[2].toLowerCase() === 'del');
                    let roles = args[0] === 'sadmin' ? cfg.servers[message.guild.id].administrators
                        : cfg.servers[message.guild.id].developers;

                    if (del) {
                        for (let i = 0; i < roles.length; i++) {
                            if (roles[i] === args[1]) {
                                roles.splice(i, 1);
                                break;
                            }
                        }
                    } else {
                        roles.push(args[1]);
                    }
                    break;
                default:
                    message.reply('Wrong configuration type argument.')
                        .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                        .catch(networkError => console.error(networkError)).catch(error => console.error(error));
                    return message.delete({timeout: 9000});
            }

            js.exportFile('config.json', cfg);
            message.channel.send('Operation finished.')
                .then(replyMessage => replyMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
            report(message, `${message.author.username} changed configuration ${args[0]} to ${args[1]}`, this.name);
            message.delete({timeout: 9000}).catch(error => console.error(error));
        }
    }
};