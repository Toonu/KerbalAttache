const {messageHandler, report, perm, log} = require("../utils");
const {prefix} = require('../database.json');

module.exports = {
    name: 'config',
    description: 'Command for configuring the settings.',
    args: 2,
    usage: `${prefix}config [OPTION] [VALUE] [DEL]\n
    OPTIONS followed by new value:
    \`\`\`
    prefix          CHAR    (Single character.)
    money           STRING  (Currency code such as EUR/USD string.)
    moneyLocale     STRING  (Currency formatting such as fr-FR string.)
    sheet           STRING  (Sheet ID string.)
    tabMain         STRING  (Main tab name of the main sheet.)
    tabSubmissions  STRING  (Submissions tab name of main sheet.)
    tabSubmissionsEnd STRING (Ending column name).
    
    turn            INT     (Changing turn number to new number.)
    era             INT     (Decimal integer, such as 50.)
    administrators  INT DEL (Server administrator role or integer.)
    developers      INT DEL (Server developer role or integer.)
    channelReporting INT    (Server internal reporting channel.)
    channelBattles  INT     (Server battle reporting channel.)
    channelAnnounce INT     (Server announcements channel.)
    roleHeadOfState INT     (Server Head of State role.)
    roleModerator   INT     (Server Moderator role.)
    
    \`\`\`
    Del option works only for role lists.
    `,
    cooldown: 5,
    guildOnly: true,
    execute: function config(message, args, db) {
        //Validating input arguments and checking permissions.
        if (perm(message, 2)) {
            if (['developers', 'administrators', 'roleHeadOfState', 'roleModerator'].includes(args[0])) {
                let role = message.mentions.roles.first();
                if (role) {
                    args[1] = role.id;
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
            } else if (['turn', 'channelReporting', 'channelBattles', 'channelAnnounce'].includes(args[0])) {
                if (args[0] === 'turn') {
                    args[1] = parseInt(args[1]);
                }
                if (Number.isNaN(parseInt(args[1]))) {
                    return messageHandler(message, new Error('InvalidTypeException: Not a proper ID/Number.'), true);
                }
            } else if (args[0] === 'money') {
                if (!new RegExp(/[A-Z]{3}/g).test(args[1])) {
                    return messageHandler(message, new Error('InvalidFormatException: Money must be using their abbreviation, not a symbol. Eg. EUR, USD...'), true);
                }
            } else if (args[0] === 'prefix' && args[1].length !== 1) {
                return messageHandler(message,
                    new Error('InvalidFormatException: Prefix can be only one character long'), true);
            }
            
            let oldValue;
            let success = false;
            for (let [name, entry] of Object.entries(db)) {
                if (entry instanceof Array && name.toLowerCase() === args[0].toLowerCase()) {
                    if (args[2] && args[2] === 'del') {
                        let deletionIndex = db[name].indexOf(args[1]);
                        if (deletionIndex !== -1) {
                            db[name].splice(deletionIndex, 1);
                            success = true;
                        }
                    } else {
                        db[name].push(args[1]);
                        success = true;
                    }
                    break;
                } else if (name.toLowerCase() === args[0].toLowerCase()) {
                    db[name] = args[1];
                    oldValue = entry;
                    success = true;
                    break;
                }
            }
            
            if (!success)
                return messageHandler(message,
                    new Error('InvalidArgumentException: Non-existing configuration option argument.'), true);
    
            db.export();
            report(message, `${message.author.username} changed configuration${(oldValue === undefined ? '' : ` from ${oldValue}`)} ${args[0]} to ${args[2] ? 'nothing'
             : args[1]}`, this.name);
            messageHandler(message, 'Operation finished.', true);
        } else {
            return message.delete().catch(error => log(error, true));
        }
    }
};