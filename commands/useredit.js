// noinspection ExceptionCaughtLocallyJS

const cfg = require('./../config.json'), {exportFile, perm, ping, report, messageHandler} = require('../utils');

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
    -cf [coefficient] float
    -name [name] string
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
        let userID = ping(message).id;
        let user = cfg.users[userID]

        //Validating input argument.
        try {
            permission = perm(message, 2, showMessage);
            if (!user) throw new Error('User does not exist! Please create user first!');
        } catch (error) {
            return messageHandler(message, error, true);
        }

        //Collects all data arguments and merges them together.
        let data = args[1];
        if (args[1] === 'del') {
            data = undefined;
        } else {
            for (let i = 2; i < args.length; i++) {
                if (!args[i].startsWith('<@')) {
                    data += ` ${args[i]}`;
                }
            }
        }

        if (args[0] === '-notes') {
            user.notes = data;
        } else if (args[0] === '-n' && permission) {
            user.nation = data;
        } else if (args[0] === '-d' && permission) {
            user.demonym = data;
        } else if (args[0] === '-c' && permission) {
            if (!data) user.color = data;
            else if (data.length !== 6) return messageHandler(message, new Error('InvalidArgumentException: Argument is not a color hex number. Modification failed.'), showMessage);
            
            // noinspection JSObjectNullOrUndefined
            user.color = data.toLowerCase();
        } else if (args[0] === '-m' && permission) {
            if (new RegExp(/https:\/\/drive.google\.com\/file\/d\/.+/).test(args[1])) {
                user.map = data;
            } else {
                return messageHandler(message, new Error('InvalidArgumentException: Argument is not a map URL link. Modification failed.'), showMessage);
            }
        } else if (args[0] === '-cf' && permission) {
            data = parseInt(data);
            if (isNaN(data)) {
                return messageHandler(message, new Error('InvalidArgumentException: Argument is not a number. Modification failed.'), showMessage);
            }
            user.cf = data;
        } else if (args[0] === '-name' && permission) {
            user.name = data;
        } else {
            return messageHandler(message, new Error('InvalidArgumentException: Modification failed either due to insufficient permissions or wrong attribute name'), showMessage);
        }

        exportFile('config.json', cfg);
        if (showMessage) {
            report(message, `<@${message.author.id}> modified <@${userID}>'s ${args[0].substring(1)} to ${data}.`, this.name);
            messageHandler(message, 'User property modified.', showMessage);
        }
    }
};
