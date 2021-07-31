const {prefix} = require('./../config.json'), {exportFile, perm} = require("../utils"), {report, log} = require("../game");
module.exports = {
    name: 'userdel',
    description: 'Command for deleting tagged user from the database.',
    args: 1,
    usage: `${prefix}userdel [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: function userdel(message) {
        const user = message.mentions.users.first();
        if (user === undefined) {
            message.channel.send('No user specified, please retry.')
                .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));

        } else if (cfg.users[user.id] === undefined) {
            message.channel.send('User does not exist, please retry.')
                .then(msg => msg.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));

        } else if (perm(message, 2)) {
            //Deleting the user and exporting the edited file.
            delete cfg.users[user.id];
            exportFile("config.json", cfg);

            report(message, `<@${message.author.id}> deleted user <@${message.mentions.users.first().id}>!`, this.name);
            log(`${message.author.nickname} deleted user ${message.mentions.users.first().username}.`);
            message.channel.send("User deleted.")
                .then(resultMessage => resultMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
        }
        return message.delete().catch(error => console.error(error));
    }
};
