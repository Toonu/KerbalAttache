const fs = require('fs'), cfg = require('./config.json'), js = require('./utils');

/**
 * Function creates new user of id with attributes of nation, color, sheet and map. Returns true if the user was created successfully.
 * @param {string} id Discord id
 * @param {string} nationIn      Nation String name
 * @param {string} demonymIn     Nation demonym
 * @param {string} colorIn       Color String hex number
 * @param {string} map           Map String link
 * @return {string} response of attributes of created user or error message.
 */
exports.createUser = function createUser(id, nationIn = 'undefined', demonymIn = 'undefined', colorIn = "fffffe", map = 'https://discord.com/') {
    if (!id) {
        throw new Error('Id is undefined!') ;
    } else if (cfg.users[id]) {
        throw new Error('User already exists!');
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

/**
 * Function checks message author clearance level against the defined level.
 * @param {module:"discord.js".Message} message Message checked.
 * @param {number} level Clearance level. 1 for developer, 2 for administrator.
 * @param {boolean} showMessage If rejecting message should be written.
 * @returns {boolean} True if author has permission, else False.
 * @throws {Error} Invalid Argument Exception: message or level is undefined.
 */
exports.perm = function perm(message, level, showMessage = true) {
    if (!message || !level || isNaN(level)) throw new Error('Invalid Argument Exception: Message or level is undefined.');
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
 * Function checks if message contains a user ping and the message originates from the moderator.
 * <br>&nbsp;&nbsp;
 * <br>If there is, returns the pinged user, alternatively returns the message author.
 * @param message {module:"discord.js".Message} Message to analyse.
 * @param level {number} Optional argument to check the clearance level. Defaults to administrator.
 * @return {module:"discord.js".User} Returns message author or pinged user.
 * @throws {Error} InvalidArgumentException: message is undefined.
 */
exports.ping = function ping(message, level = 2) {
    if (!message) throw new Error('Invalid Argument Exception: Message is undefined.')

    let nation = message.author;

    if (message.mentions.users.first()) {
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

/**
 * Function reports an error or a message to the console and the Discord channel of the original message.
 * <br>&nbsp;&nbsp;
 * <br>Logs into the console if the content is Error.
 * @param {module:"discord.js".Message} message Message for channel to reply in.
 * @param content {string || module:"discord.js".MessageEmbed || Error} Reported object.
 * @param {boolean} deleteMessage If the message should be deleted.
 * @param timer {number} Timeout for the posted message.
 */
exports.messageHandler = function messageHandler(message, content, deleteMessage = false,timer = 10000) {
    if (content instanceof Error) {
            js.log(`${content.message}\n${content.stack}`);
        content = content.message;
    }
    message.channel.send(content)
        .then(msg => msg.delete({timeout: timer}).catch(error => js.log(error, true)))
        .catch(networkError => js.log(networkError, true));
    if (deleteMessage) message.delete().catch(error => js.log(error, true));
}


/**
 * Function logs a message to the console with timestamp.
 * @param {string} report Message to log.
 * @param {boolean} erroneous is true if console.error is used.
 */
exports.log = function log(report, erroneous = false) {
    let today = new Date();
    let dateTime = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
    if (erroneous) {
        console.error(`[${dateTime} UTC] ${report}`);
    } else {
        console.log(`[${dateTime} UTC] ${report}`);
    }
}

/**
 * Function reports information into the moderator channel and logs it into the console.
 * @param {module:"discord.js".Message} message specifies server to search main channel in.
 * @param {string} report    message to report.
 * @param {string} command   command name the report originated from.
 */
exports.report = function report(message, report, command = '') {
    let today = new Date();
    let dateTime = `${today.getUTCFullYear()}.${(today.getUTCMonth() < 10 ? '0' : '') + (today.getUTCMonth() + 1)}.${(today.getUTCDate() < 10 ? '0' : '') + today.getUTCDate()} ${today.getUTCHours()}:${(today.getUTCMinutes() < 10 ? '0' : '') + today.getUTCMinutes()}:${(today.getUTCSeconds() < 10 ? '0' : '') + today.getUTCSeconds()}`;
    js.log(report);
    message.client.channels.cache.get(cfg.servers[message.guild.id].mainid).send(`[${dateTime.padEnd(21)}UTC] [${command}]: ${report}`)
        .catch(networkError => console.error(networkError));
}