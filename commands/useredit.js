// noinspection ExceptionCaughtLocallyJS

const {perm, report, messageHandler, log} = require('../utils');
const {State} = require('../dataStructures/State');
const {prefix} = require('../database.json');

module.exports = {
    name: 'useredit',
    description: 'Command for editing user data.',
    args: 2,
    usage: `${prefix}useredit [OPTION] [DATA / DEL] [USER]\n
    You can use only one option at a time!
    Write del instead of data to remove the data.
    Your notes are always editable even without clearance.
    
    OPTIONS followed by new value:
    \`\`\`
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -cf [CF] int
    -notes [notes] string
    -state creates undefined state\`\`\``,
    cooldown: 5,
    guildOnly: true,
    usesDB: true,
    execute: function useredit(message, args, db) {
        //Validating input arguments and parsing them into user to edit.
        const discordUser = message.mentions.users.first();
        if (!discordUser) {
            return messageHandler(message,
                new Error('InvalidArgumentException: No user specified, canceling operation.'), true);
        }
        const dbUser = db.getUser(discordUser);
        if (!dbUser) {
            return messageHandler(message,
                new Error('InvalidArgumentException: User does not exist, canceling operation.'), true);
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
    
        //Validating user input since everything but notes need permissions.
        if (args[0] !== '-notes' ) {
            if (!dbUser.state) {
                if (args[0] === '-state') {
                    dbUser.state = new State(undefined, undefined);
                    return messageHandler(message, 'State created, please edit the user state with name and other' +
                        ' properities', true);
                } else {
                    return messageHandler(message,
                        new Error(`NullReferenceException: User does not have assigned any state, please create`
                            + 'a new state first. Canceling operation.'), true);
                }
            } else if (!perm(message, 1)) {
                return message.delete().catch(error => log(error, true));
            }
        }
        
        //Setting new value based on option = args[0].
        try {
            switch (args[0]) {
                case '-notes':
                    if (dbUser.isEqual(message.author)) {
                        dbUser.notes = data;
                    } else {
                        return messageHandler(message,
                            new Error('InvalidOperationException: Editing notes of another user is not allowed.'), true);
                    }
                    break;
                case '-n':
                    dbUser.state.name = data;
                    break;
                case '-d':
                    dbUser.state.demonym = data;
                    break;
                case '-c':
                    if (data === 'del') {
                        data = 'fffffe';
                    }
                    dbUser.state.colour = data;
                    break;
                case '-m':
                    if (data === 'del') {
                        data = 'https://x.com/';
                    }
                    dbUser.state.map = data;
                    break;
                case '-cf':
                    if (data === 'del') {
                        data = 1;
                    }
                    dbUser.state.research.CF = data;
                    break;
                default:
                    return messageHandler(message,
                        new Error(`InvalidOperationException: Option ${args[0]} is not a valid option!`), true);
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }
        
        //Exporting and reporting if successful.
        db.export();
        report(message, `${message.author} modified ${discordUser}'s ${args[0].substring(1)} to ${data}.`, this.name);
        messageHandler(message, 'User property modified.', true);
    },
};
