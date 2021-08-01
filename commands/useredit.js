const cfg = require('./../config.json'), {exportFile, perm, ping, report, messageHandler} = require('../utils');

module.exports = {
    name: 'useredit',
    description: 'Command for editing user data. Your notes are always editable even without clearance. ' +
        'Write del instead of data to remove the data.',
    args: 2,
    usage: `${cfg.prefix}useredit [OPTION] [DATA / DEL] [USER]\n
    OPTIONS followed by new value:
    \`\`\`
    -n [nation] string
    -c [color] hex colour int
    -m [map] URL
    -d [demonym] string
    -notes [notes] string\`\`\``,
    cooldown: 5,
    guildOnly: true,
    /**
     * Function edits user data in the configuration.
     * @param message to gather information from.
     * @param {Array} args command arguments.
     * @param showMessage if reply messages should be shown.
     * @return {void|*}
     */
    execute: function useredit(message, args, showMessage = true) {
        let permission;
        let user;

        try {
            permission = perm(message, 2, showMessage);
            user = ping(message).id;
            //Creating non-existent user.
            if (!cfg.users[user]) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('User does not exist! Please create user first!');
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }

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


        if (args[0] === '-notes') {
            cfg.users[user].notes = data;
        } else if (args[0] === '-n' && permission) {
            cfg.users[user].nation = data;
        } else if (args[0] === '-d' && permission) {
            cfg.users[user].demonym = data;
        } else if (args[0] === '-c' && permission) {
            if (data.length !== 6) {
                return messageHandler(message, new Error('InvalidArgumentException: Argument is not a color hex number. Modification failed.'), showMessage);
            }
            cfg.users[user].color = data.toLowerCase();
        } else if (args[0] === '-m' && permission) {
            if (new RegExp(/https:\/\/drive.google\.com\/file\/d\/.+/).test(args[1])) {
                cfg.users[user].map = data;
            } else {
                return messageHandler(message, new Error('InvalidArgumentException: Argument is not a map URL link. Modification failed.'), showMessage);
            }
        } else if (args[0] === '-cf' && permission) {
            data = parseInt(data);
            if (isNaN(data)) {
                return messageHandler(message, new Error('InvalidArgumentException: Argument is not a number. Modification failed.'), showMessage);
            }
            cfg.users[user].cf = data;
        } else {
            return messageHandler(message, new Error('InvalidArgumentException: Modification failed either due to insufficient permissions or wrong attribute name'), showMessage);
        }

        exportFile('config.json', cfg);
        if (showMessage) {
            report(message, `<@${message.author.id}> modified <@${user}>'s ${args[0]} to ${data}.`, this.name);
            messageHandler(message, 'User property modified.', showMessage);
        }
    }
};
