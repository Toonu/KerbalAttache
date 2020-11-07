import { writeFileSync } from 'fs';
import cfg, { users, servers } from './config.json';

/**
 * Method creates a new user for config.json file and adds his parameters.
 * @param {Number} id        User Discord ID tag.
 * @param {String} nationIn  User Nation name.
 * @param {String} colorIn   User National hex color.
 * @param {String} sheet     User Sheet link.
 * @param {String} map       User Map link.
 */
export function createUser(id, nationIn, colorIn, sheet, map) {
    if (nationIn == undefined) {
        nationIn = "undefined";
    }
    if (colorIn == undefined) {
        colorIn = "undefined";
    }
    if (sheet == undefined) {
        sheet = '11111114';
    }
    if (map == undefined) {
        map = 'www.x.com';
    }

    users[id] = {
        nation: nationIn, 
        color: colorIn, 
        cf: 1,
        sheet: sheet,
        map: map,
        notes: " ",
        egg: " "
    }
    exportFile("config.json", cfg);
    return true;
}

/**
 * Function exports a file with specified JSON object data.
 * @param {String} file filename.
 * @param {Object} data JSON object data.
 */
export function exportFile(file, data) {
    writeFileSync(file, JSON.stringify(data, null, 4));
}

/**
 * Represents permission checking function. Checks author of the message against the permissions type.
 * @param {Message} message Message to retrieve channel to interact with.
 * @param {Number} level     Permission level.
 */
export function perm(message, level) {
    let adm = servers[message.guild.id].administrators;
    let dev = servers[message.guild.id].developers;
    switch(level) {
        case 0:
            return true;
        case 1:
            if (adm.some(r=> message.member.roles.cache.has(r)) || dev.some(r=> message.member.roles.cache.has(r))) return true;
            break;
        case 2:
            if (adm.some(r=> message.member.roles.cache.has(r))) return true;
    }
    message.reply("you do not have permission to do that. The Directorate for Distribution of information apologies.")
    return false;
}