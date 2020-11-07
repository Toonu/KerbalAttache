const fs = require('fs');
const cfg = require('./config.json');
const js = require('./jsonManagement');

/**
 * Function creates new user of id with attributes of nation, color, sheet and map. Returns true if the user was created successfully.
 * @param id            Discord id
 * @param nationIn      Nation String name
 * @param colorIn       Color String hex number
 * @param sheet         Sheet string number
 * @param map           Map String link
 */
exports.createUser = function createUser(id, nationIn, colorIn, sheet, map) {
    if (nationIn === undefined) {
        nationIn = "undefined";
    }
    if (colorIn === undefined) {
        colorIn = "undefined";
    }
    if (sheet === undefined) {
        sheet = '11111114';
    }
    if (map === undefined) {
        map = 'www.x.com';
    }

    cfg.users[id] = {
        nation: nationIn, 
        color: colorIn, 
        cf: 1,
        sheet: sheet,
        map: map,
        notes: " ",
    }
    js.exportFile("config.json", cfg);
    console.log(`Nation ${nationIn} created with Discord id of ${id}.`)
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
 * Function checks message author permission against the level of permission needed.
 * @param message       Message checked.
 * @param level         Permission level.
 * @param msg           Msg boolean specifies if message should be written in case of not high enough clearance.
 * @returns {boolean}   True if has permission, else False.
 */
exports.perm = function perm(message, level, msg) {
    let adm = cfg.servers[message.guild.id].administrators;
    let dev = cfg.servers[message.guild.id].developers;

    if (level === 2 && (adm.some(r=> message.member.roles.cache.has(r)) || dev.some(r=> message.member.roles.cache.has(r)))) {
        return true;
    } else if (level === 1 && (adm.some(r=> message.member.roles.cache.has(r)))) {
        return true;
    }
    if (msg) {
        message.channel.send('Directorate of Information apologies. Your clearance is not sufficient for this operation. Please contact the moderators if you deem this as an error.')
            .then(msg => msg.delete({timeout: 12000}));
    }
    return false;
};

/**
 * Function checks if user is pinged and assigns him as return, else assigns author.
 * @param message   Message to scan.
 * @returns {User}  User that is assigned.
 */
exports.ping = function ping(message) {
    let nation = message.author;
    if(js.perm(message, 2, false) && message.mentions.users.first() !== undefined) {
        nation = message.mentions.users.first();
    }
    return nation;
}

