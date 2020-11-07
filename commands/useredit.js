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
        const js = require('../jsonManagement');
        const cfg = require('./../config.json');
        let perm = js.perm(message, 2, false);
        let user = js.ping(message).id;
        let data = args[1];

        if (cfg.users[user] === undefined) {
            js.createUser(user);
            useredit(message, args);
        }
        if (args[1] === 'del') {
            data = undefined;
        }

        if (args[0] === 'notes') {
            cfg.users[user].notes = data;
        } else if (args[0] === 'nation' && perm) {
            cfg.users[user].nation = data;
        } else if (args[0] === 'color' && perm) {
            cfg.users[user].color = data;
        } else if (args[0] === 'sheet' && perm) {
            cfg.users[user].sheet = data;
        } else if (args[0] === 'map' && perm) {
                cfg.users[user].map = data;
        } else {
            message.channel.send('Modification failed either due to insufficient permissions or wrong attribute name').then(msg => msg.delete({timeout: 12000}));
            message.delete({timeout: 12000});
            return;
        }

        js.exportFile("config.json", cfg);
        message.channel.send('User property modified.').then(msg => msg.delete({timeout: 12000}));
        message.delete({timeout: 12000});
    }
};