const {report} = require("../game"), {createUser, perm} = require("../jsonManagement"), {execute} = require('../commands/useredit');
module.exports = {
    name: 'usercreate',
    description: 'Command for creating new user in the database.',
    args: true,
    usage: '[M:@user] -n [M:nation] -c [M:color] -s [M:sheet] -m [M:map] -d [M:demonym] -notes [M:notes]',
    cooldown: 5,
    guildOnly: true,
    execute: function usercreate(message, args) {
        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry. ').then(msg => msg.delete({timeout: 9000}));
            return message.delete({timeout: 9000});
        }
        if (perm(message, 2, true)) {
            let result = createUser(user.id);

            //Uses useredit command to assign the values.
            for (let i = 1; i < args.length; i++) {
                if (args[i] === '-notes') {
                    let data = '';
                    for (let j = i + 1; j < args.length; j++) {
                        data += ` ${args[j]}`;
                    }
                    execute(message, [`notes`, data.trim()], false);
                } else if (args[i].startsWith('-')) {
                    execute(message, [args[i][1], args[i + 1]], false);
                }
            }

            if (result.startsWith('Nation')) {
                report(message, `${result} created by <@${message.author.id}>`, this.name);
                message.channel.send('User created.').then(msg => msg.delete({timeout: 9000}));
            } else {
                message.channel.send(result).then(msg => msg.delete({timeout: 9000}));
            }
            message.delete({timeout: 9000});
        }
    }
};

