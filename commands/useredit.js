// noinspection ExceptionCaughtLocallyJS

const cfg = require('./../config.json'), {perm, report, messageHandler, log} = require('../utils');

module.exports = {
    name: 'useredit',
    description: 'Command for editing user data. Your notes are always editable even without clearance. ' +
        'Write del instead of data to remove the data.',
    args: 2,
    usage: `${cfg.prefix}useredit [OPTION] [DATA / DEL] [USER]\n
    You can use only one option at a time!
    OPTIONS followed by new value:
    \`\`\`
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -name [name] string
    -notes [notes] string\`\`\``,
    cooldown: 5,
    guildOnly: true,
    execute: function useredit(message, args, db) {
        const discordUser = message.mentions.users.first();
    
        //Validating input arguments.
        if (!discordUser) {
            return messageHandler(message,
                new Error('InvalidArgumentException: No user specified, please retry.'), true);
        }
        
        let dbUser;
        for (dbUser of db.users) {
            if (dbUser.isEqual(discordUser)) {
                break;
            }
        }
        
        if (!dbUser) {
            return messageHandler(message,
                new Error('InvalidArgumentException: User does not exists.'), true);
        }


        //Collects all data arguments and merges them together.
        let data = args[1];
        if (data !== 'del') {
            for (let i = 2; i < args.length; i++) {
                if (!args[i].startsWith('<@')) {
                    data += ` ${args[i]}`;
                }
            }
        }
    
        if (args[0] !== '-notes') {
            if (!dbUser.state) {
                return messageHandler(message, new Error('User does not have assigned any state.'), true);
            } else if (!perm(message, 2)) {
                return message.delete().catch(error => log(error, true));
            }
        }
        try {
            switch (args[0]) {
                case '-notes':
                    dbUser.notes = data;
                    break;
                case '-n':
                    dbUser.state.name = data;
                    break;
                case '-d':
                    dbUser.state.demonym = data;
                    break;
                case '-c':
                    //deleting
                    if (data === 'del') {
                        data = 'fffffe';
                    }
                    dbUser.state.colour = data;
                    break;
                case '-m':
                    //deleting
                    if (data === 'del') {
                        data = 'https://x.com/';
                    }
                    dbUser.state.map = data;
                    break;
                case '-cf':
                    dbUser.state.research.CF = data;
                    break;
                default:
                    return messageHandler(message,
                        new Error(`InvalidOperationException: Option ${args[0]} is not a valid option!`), true);
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }
        
        db.export();
        report(message, `<@${message.author.id}> modified <@${discordUser}>'s ${args[0].substring(1)} to ${data}.`, this.name);
        messageHandler(message, 'User property modified.', true);
    }
};
