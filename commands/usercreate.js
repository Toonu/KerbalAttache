const {prefix} = require("../config.json"), {report} = require("../game"), {createUser, perm} = require("../utils"),
    {execute} = require('../commands/useredit');
const cfg = require("./../config.json");
module.exports = {
    name: 'usercreate',
    description: 'Command for creating new user in the database.',
    args: 0,
    usage: `${prefix}usercreate OPTION... [USER]...
    OPTIONS followed by new value:
    
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -notes [notes] string`,
    cooldown: 5,
    guildOnly: true,
    execute: function usercreate(message, args) {
        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry. ')
                .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error))
                .catch(networkError => console.error(networkError)));
            return message.delete({timeout: 9000}).catch(error => console.error(error));
        }
        if (perm(message, 2)) {
            let result = createUser(user.id);

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

            if (result.startsWith('Nation')) {
                report(message, `Nation ${cfg.users[user.id].nation} was created by <@${message.author.id}>`, this.name);
                message.channel.send('User created.')
                    .then(successMessage => successMessage.delete({timeout: 9000}).catch(error => console.error(error))
                    .catch(networkError => console.error(networkError)));
            } else {
                message.channel.send(result)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error))
                    .catch(networkError => console.error(networkError)));
            }
            message.delete().catch(error => console.error(error));
        }
    }
};

