const fs = require('fs'), cfg = require('./config.json'), js = require('./utils');
/**
 * Function creates new user of id with attributes of nation, color, sheet and map. Returns true if the user was created successfully.
 * @param id            Discord id
 * @param nationIn      Nation String name
 * @param demonymIn     Nation demonym
 * @param colorIn       Color String hex number
 * @param map           Map String link
 * @return String response of attributes of created user.
 */
exports.createUser = function createUser(id, nationIn = 'undefined', demonymIn = 'undefined', colorIn = "fffffe", map = 'https://discord.com/') {
    if (cfg.users[id] !== undefined) {
        return 'User already exists!';
    }

    //Adds user to the json file.
    cfg.users[id] = {
        nation: nationIn,
        demonym: demonymIn,
        color: colorIn,
        cf: 1,
        map: map,
        notes: " ",
    }

    js.exportFile("config.json", cfg);
    return`Nation ${nationIn} created for user <@${id}>`
};

/**
 * Function exports json file from JSON object.
 * @param file  Filename to export.
 * @param data  JSON Object to write in.
 */
exports.exportFile = function exportFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
};

exports.toColumn = function toColumn(num) {
    let column = '';
    let preceding = 0;
    while (num > 25) {
        num -= 26;
        preceding++;
    }
    if (preceding !== 0) column += String.fromCharCode(64 + preceding);
    column += String.fromCharCode(65 + num);
    return column;
};

/**
 * Function checks message author permission against the level of permission needed.
 * @param message       Message checked.
 * @param level         Permission level.
 * @param showMessage = true           Msg boolean specifies if message should be written in case of not high enough clearance.
 * @returns {boolean}   True if has permission, else False.
 */
exports.perm = function perm(message, level, showMessage = true) {
    if (message.channel.type === 'dm') return true;

    let clearance = false;
    switch (level) {
        case 1:
            clearance = (cfg.servers[message.guild.id].developers.some(r => message.member.roles.cache.has(r))
                || cfg.servers[message.guild.id].administrators.some(r => message.member.roles.cache.has(r)));
            break;
        case 2:
            clearance = (cfg.servers[message.guild.id].administrators.some(r => message.member.roles.cache.has(r)));
            break;
        default:
            break;
    }

    if (!clearance && showMessage === true) message.channel.send('Directorate of Information apologies. Your clearance is not sufficient for this operation. Please contact the moderators if you deem this as an error.')
        .then(permissionMessage => permissionMessage.delete({timeout: 12000})
            .catch(error => console.error(error)))
        .catch(error => console.error(error));
    return clearance;
};

/**
 * Function checks if message contains a user ping and the message originates from the moderator. If there is, assigns him as the message nation, else assigns the message author.
 * @param message   Message to analyse.
 * @param level     Optional argument to check the clearance level. Defaults to administrator.
 */
exports.ping = function ping(message, level = 2) {
    let nation = message.author;

    if (message.mentions.users.first() !== undefined) {
        if (js.perm(message, level, false)) {
            nation = message.mentions.users.first();
        } else {
            message.channel.send('You lack sufficient clearance to do this for tagged player. Defaulting to yourself.')
                .then(permissionMessage => permissionMessage.delete({timeout: 12000})
                    .catch(error => console.error(error)))
                .catch(error => console.error(error));
        }
    }
    return nation;
}

