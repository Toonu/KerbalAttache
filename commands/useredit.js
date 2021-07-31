const cfg = require('./../config.json'), {exportFile, createUser, perm, ping} = require("../utils"),
    {report} = require("../game");
module.exports = {
    name: 'useredit',
    description: 'Command for editing user data! Your notes are always editable even without permissions. ' +
        'Write del instead of data to remove the data.',
    args: 2,
    usage: `${cfg.prefix}useredit [OPTION] [DATA / DEL] [USER]
    
OPTIONS:

-n [nation] string
-c [color] hex colour int
-m [map] URL
-d [demonym] string
-notes [notes] string\`,`,
    cooldown: 5,
    guildOnly: true,
    execute: function useredit(message, args, msg = true) {
        let permission = perm(message, 2, msg);
        let user = ping(message).id;

        let data = args[1];
        //Collects all data arguments and merges them together.
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
            report(message, `${createUser(user)} created by <@${message.author.id}>`, this.name);
            useredit(message, args);
        }

        if (args[0] === '-notes') {
            cfg.users[user].notes = data;
        } else if (args[0] === '-n' && permission) {
            cfg.users[user].nation = data;
        } else if (args[0] === '-d' && permission) {
            cfg.users[user].demonym = data;
        } else if (args[0] === '-c' && permission) {
            if (data.length !== 6) {
                if (msg) message.delete().catch(error => console.error(error));
                return message.channel.send('Argument is not a color hex number. Modification failed.')
                    .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
            }
            cfg.users[user].color = data.toLowerCase();
        } else if (args[0] === '-m' && permission) {
            if (new RegExp(/https:\/\/drive.google\.com\/file\/d\/.+/).test(args[1])) {
                cfg.users[user].map = data;
            } else {
                if (msg) message.delete().catch(error => console.error(error));
                return message.channel.send('Argument is not a map URL link. Modification failed.')
                    .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
            }
        } else if (args[0] === '-cf' && permission) {
            data = parseInt(data);
            if (isNaN(data)) {
                if (msg) message.delete().catch(error => console.error(error));
                return message.channel.send('Argument is not a number. Modification failed.')
                    .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
            }
            cfg.users[user].cf = data;
        } else {
            if (msg) message.delete()
                .catch(error => console.error(error));
            return message.channel.send('Modification failed either due to insufficient permissions or wrong attribute name')
                .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
        }

        exportFile("config.json", cfg);
        if (msg) {
            message.channel.send('User property modified.')
                .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
            message.delete().catch(error => console.error(error));
            report(message, `<@${message.author.id}> modified <@${user}>'s ${args[0]} to ${data}.`, this.name)
        }
    }
};
