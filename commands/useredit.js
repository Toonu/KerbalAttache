const cfg = require('./../config.json'), {exportFile, createUser, perm, ping} = require("../jsonManagement"),
    {report} = require("../game");
module.exports = {
    name: 'useredit',
    description: 'Command for editing user data in the database! Your notes are always editable even without permissions.',
    args: true,
    usage: `[operation] [data | del] [M:@user]
    
Possible operations:
\`\`\`
notes | notes
\`\`\`
Moderators only: 
\`\`\`
n  | nation
d  | demonym
c  | color
s  | sheet
m  | map
cf | coefficient
\`\`\``,
    cooldown: 5,
    guildOnly: true,
    /**
     * Method edits user parameters in main config file with new data.
     * @param message   Message author taken as printed user.
     * @param args      Operation String, New data String, User tag.
     * @param msg       If message is shown.
     * @returns {*}     Error message.
     */
    execute: function useredit(message, args, msg = true) {
        let permission = perm(message, 2, false);
        let user = ping(message).id;

        let data = args[1];
        //Collects all data arguments
        if (args[1] === 'del') {
            data = ' ';
        } else {
            for (let i = 2; i < args.length; i++) {
                if (!args[i].startsWith('<@')) {
                    data += ` ${args[i]}`;
                }
            }
        }

        if (cfg.users[user] === undefined) {
            report(message, `${createUser(user, args[1], args[2], args[3], args[4])} created by <@${message.author.id}>`, this.name);
            useredit(message, args);
            message.delete({timeout: 9000});
        }

        if (args[0] === 'notes') {
            cfg.users[user].notes = data;
        } else if (args[0] === 'n' && permission) {
            cfg.users[user].nation = data;
        } else if (args[0] === 'd' && permission) {
            cfg.users[user].demonym = data;
        } else if (args[0] === 'c' && permission) {
            if (data.length > 6) {
                if (msg) message.delete({timeout: 9000});
                return message.channel.send('Argument is not a color hex number. Modification failed.').then(msg => msg.delete({timeout: 9000}));
            }
            cfg.users[user].color = data;
        } else if (args[0] === 's' && permission) {
            cfg.users[user].sheet = args[1];
            data = args[1];
        } else if (args[0] === 'm' && permission) {
            let regExp = new RegExp(/https:\/\/app.diagrams\.net\/.+/);
            if (regExp.test(args[1])) {
                cfg.users[user].map = args[1];
                data = args[1]
            } else {
                if (msg) message.delete({timeout: 9000});
                return message.channel.send('Argument is not a map URL link. Modification failed.').then(msg => msg.delete({timeout: 9000}));
            }
        } else if (args[0] === 'cf' && permission) {
            data = parseInt(data);
            if (isNaN(data)) {
                if (msg) message.delete({timeout: 9000});
                return message.channel.send('Argument is not a number. Modification failed.').then(msg => msg.delete({timeout: 9000}));
            }
            cfg.users[user].cf = data;
        } else {
            if (msg) message.delete({timeout: 9000});
            return message.channel.send('Modification failed either due to insufficient permissions or wrong attribute name').then(msg => msg.delete({timeout: 9000}));
        }

        exportFile("config.json", cfg);
        if (msg) {
            message.channel.send('User property modified.').then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
            report(message, `<@${message.author.id}> modified <@${user}>'s ${args[0]} to ${data}.`, this.name)
        }
    }
};
