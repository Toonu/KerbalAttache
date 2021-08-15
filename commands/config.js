const cfg = require('../config.json'), {messageHandler, report, perm, exportFile} = require("../utils");
module.exports = {
    name: 'config',
    description: 'Command for configuring the settings.',
    args: 2,
    usage: `${cfg.prefix}config [OPTION] [VALUE] [DEL]\n
    OPTIONS followed by new value:
    \`\`\`
    money           STRING  (Currency code such as EUR/USD string.)
    moneyLocale     STRING  (Currency formatting such as fr-FR string.)
    sheet           STRING  (Sheet ID string.)
    era             INT     (Decimal integer, such as 50.)
    sname           STRING  (Server internal name string.)
    smainid         INT     (Server main announcements channel ID integer.)
    sbattleid       INT     (Server battle announcements channel ID integer.)
    sadmin          INT DEL (Server administrator roles integer.)
    sdev            INT DEL (Server developer roles integer.)
    sheadofstate    STRING  (Server Head of State role string.)
    main            STRING  (Sheet main tab string.)
    submissions     STRING  (Sheet submissions tab string.)
    systems         STRING  (Sheet systems tab string.)
    turn            INT     (Changing turn number to new number.)
    \`\`\`
    Del option works only for role lists.
    `,
    cooldown: 5,
    guildOnly: true,
    execute: function configBot(message, args, db) {
        //Validating input arguments and checking permissions.
        if (perm(message, 2)) {
            if (!['money', 'sheet', 'sname', 'submissions', 'main', 'systems', 'moneyLocale', 'sheadofstate', 'sdev', 'sadmin'].includes(args[0])
                && Number.isNaN(parseInt(args[1]))) {
                return messageHandler(message, new Error('InvalidTypeException: Not a proper ID/Number.'), true);
            } else if (['sdev', 'sadmin'].includes(args[0])) {
                args[1] = message.mentions.roles.first();
                if (args[1]) {
                    args[1] = args[1].id;
                } else if (Number.isNaN(parseInt(args[1]))) {
                    return messageHandler(message, new Error('InvalidTypeException: Not a proper ID/Number.'), true);
                }
            } else if (args[0] === 'era') {
                args[1] = parseInt(args[1]);
                if (Number.isNaN(args[1])) {
                    return messageHandler(message, new Error('InvalidTypeException: Not a proper ID/Number.'), true);
                } else if (args[1] % 10 !== 0) {
                    return messageHandler(message, new Error('InvalidFormatException: Era must have zero at the end. Eg. 50, 60...'), true);
                }
            } else if (args[0] === 'money') {
                if (!new RegExp(/[A-Z]{3}/g).test(args[1])) {
                    return messageHandler(message, new Error('InvalidFormatException: Money must be using their abbreviation, not a symbol. Eg. EUR, USD...'), true);
                }
            }

            switch (args[0]) {
                case 'turn':
                    db.turn = args[1];
                    db.export();
                    break;
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
                    
                    // noinspection JSUnresolvedVariable
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
                    return messageHandler(message, new Error('InvalidArgumentException: Non-existing configuration option argument.'), true);
            }

            exportFile('config.json', cfg);
            report(message, `${message.author.username} changed configuration ${args[0]} to ${args[1]}`, this.name);
            messageHandler(message, 'Operation finished.', true);
        }
    }
};