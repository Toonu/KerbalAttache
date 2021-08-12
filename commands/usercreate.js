const cfg = require('../config.json'), {report, perm, messageHandler} = require('../utils');
const {DatabaseUser} = require('../dataStructures/DatabaseUser.js');
const {State} = require('../dataStructures/State');
module.exports = {
    name: 'usercreate',
    description: 'Command for creating new user in the database.',
    args: 0,
    usage: `${cfg.prefix}usercreate OPTIONS... [USER]...\n
    OPTIONS followed by new value:
    \`\`\`
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -notes [notes] string\`\`\`\nSet no option to create state-less user. Notes can be used for state-less users.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function usercreate(message, args, db) {
        if (perm(message, 2)) {
            const discordUser = message.mentions.users.first();
            const state = new State(undefined, undefined);
            
            //Validating input arguments.
            if (!discordUser)
                return messageHandler(message,
                    new Error('InvalidArgumentException: No user specified, please retry.'), true);
            else if (db.users.some(user => user.isEqual(discordUser))) {
                return messageHandler(message,
                    new Error('InvalidArgumentException: User already exists.'), true);
            }
    
            let dbUser = new DatabaseUser(discordUser);
            let option = undefined;
            let data = '';
            //Loops arguments and assigning values. Error in any of them cancels the whole operation.
            for (let i = 0; i < args.length; i++) {
                if ((args[i].startsWith('-') || args[i].startsWith('<@')) && option) {
                    try {
                        data = data.trim();
                        switch (option) {
                            case '-n':
                                state.name = data;
                                break;
                            case '-d':
                                state.demonym = data;
                                break;
                            case '-m':
                                state.map = data;
                                break;
                            case '-c':
                                state.colour = data;
                                break;
                            case '-notes':
                                dbUser.notes = data;
                                break;
                            default:
                                return messageHandler(message,
                                    new Error(`InvalidOperationException: Option ${option} is not a valid option!`), true);
                        }
                    } catch (error) {
                        return messageHandler(message, error, true);
                    }
                    if (args[i]) {
                        option = args[i];
                        data = '';
                    }
                } else if (args[i].startsWith('-')) {
                    option = args[i];
                } else if (!args[i].startsWith('<@')) {
                    data += `${args[i]} `;
                }
            }
            
            //Export and reporting.
            dbUser.state = state ? state : undefined;
            db.addUser(dbUser);
            db.export();
            
            report(message, `User ${discordUser.username} was created by <@${message.author.id}>`, this.name);
            messageHandler(message, 'User was created.', true);
        }
    }
};
