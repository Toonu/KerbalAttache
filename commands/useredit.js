const cfg = require('./../config.json'), {exportFile, createUser, perm, ping} = require("../jsonManagement"),
    {report} = require("../game");
module.exports = {
    name: 'useredit',
    description: 'Command for editing users! Your notes are always editable',
    args: true,
    usage: `[operation] [attribute | del] [M:@user]\nOperations:\nnotes, (Moderators only: nation, color, sheet, map)`,
    cooldown: 5,
    guildOnly: true,
    /**
     * Method edits user parameters in main config file with new data.
     * @param message   Message author taken as printed user.
     * @param args      Operation String, New data String, User tag.
     * @returns {*}     Error message.
     */
    execute: function useredit(message, args) {
        let permission = perm(message, 2, false);
        let user = ping(message).id;
        let data = args[1];

        if (cfg.users[user] === undefined) {
            report(message, `${createUser(user, args[1], args[2], args[3], args[4])} by ${message.author.username}`);
            useredit(message, args);
            message.delete({timeout: 9000});
        }
        if (args[1] === 'del') {
            data = ' ';
        }

        if (args[0] === 'notes') {
            cfg.users[user].notes = data;
        } else if (args[0] === 'nation' && permission) {
            cfg.users[user].nation = data;
        } else if (args[0] === 'color' && permission) {
            cfg.users[user].color = data;
        } else if (args[0] === 'sheet' && permission) {
            cfg.users[user].sheet = data;
        } else if (args[0] === 'map' && permission) {
                cfg.users[user].map = data;
        } else {
            message.channel.send('Modification failed either due to insufficient permissions or wrong attribute name').then(msg => msg.delete({timeout: 9000}));
            message.delete({timeout: 9000});
            return;
        }

        exportFile("config.json", cfg);
        message.channel.send('User property modified.').then(msg => msg.delete({timeout: 9000}));
    }
};