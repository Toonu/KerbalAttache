module.exports = {
    name: 'useredit',
    description: 'Command for editing users! Your notes are always editable',
    args: true,
    usage: '<operation> <data/del> <A:@user>\Operations:\n0: Nation (M), 1: color (M), 2: pwd (M), 3: notes (U), permissions to edit the value are in ()',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const js = require('./../json');
        const cfg = require('./../config.json')

        if (js.perm(message, 2) || (args[0] == '3' && message.mentions.users.first() == message.author)) {
            let user = message.author;

            try {
                args[0] = parseInt(args[0]);
                if (isNaN(args[0])) throw 'Argument type is not a number! Canceling operation'
                if (args[2] != undefined) {
                    user = message.mentions.users.first();
                }
            } catch(err) {
                console.error(err);
                return;
            }

            if(cfg.users[user.id] == undefined) {
                js.createUser(user.id);
                execute(message, args);
                return;
            } else if (args[1] == 'del' && modifyUser(user.id, args[0], 'undefined')) {
                message.channel.send('User property deleted.');
            } else if (modifyUser(user.id, args[0], args[1])) {
                message.channel.send('User property modified.');
            } else {
                message.channel.send('Modification failed.');
            }
        }        
    }
};

function modifyUser(id, type, data) {
    const js = require('./../json');
    const cfg = require('./../config.json');

    switch(type) {
        case 0:
            cfg.users[id].nation = data;
            break;
        case 1:
            cfg.users[id].color = data;
            break;
        case 2:
            cfg.users[id].password = data;
            break;
        case 3:
            cfg.users[id].notes = data;
            break;
        case 4:
            cfg.users[id].sheet = data;
            break;
        case 5:
            cfg.users[id].egg = data;
            break;
        default:
            return false;
    }

    js.exportFile("config.json", cfg);
    return true;
}
