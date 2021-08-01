const cfg = require('../config.json'), {report, createUser, perm, messageHandler} = require('../utils'),
    {execute} = require('../commands/useredit');
module.exports = {
    name: 'usercreate',
    description: 'Command for creating new user in the database.',
    args: 0,
    usage: `${cfg.prefix}usercreate OPTION... [USER]...
    OPTIONS followed by new value:
    
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -notes [notes] string`,
    cooldown: 5,
    guildOnly: true,
    execute: function usercreate(message, args) {
        if (message.mentions.users.size === 0) {
            return messageHandler(message, new Error('InvalidArgumentException: No user specified, please retry.'), true);
        }
        const user = message.mentions.users.first().id;
        if (perm(message, 2)) {
            try {
                report(message, `${createUser(user)} created by <@${message.author.id}>`, 'usercreate');
            } catch (error) {
                return messageHandler(message, error, true);
            }

            //Uses useredit command to assign the values.
            for (let i = 1; i < args.length; i++) {

                //Concentrates spaced values
                let data = '';
                for (let j = i + 1; j < args.length; j++) {
                    if (args[j].startsWith('-')) {
                        break;
                    }
                    data += ` ${args[j]}`;
                }
                if (args[i] === '-notes') {
                    execute(message, [`-notes`, data.trim()], false);
                } else if (args[i].startsWith('-')) {
                    execute(message, [args[i], data.trim()], false);
                }
            }

            messageHandler(message, 'User was created.', true);
        }
    }
};

