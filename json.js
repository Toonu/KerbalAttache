const fs = require('fs');
const cfg = require('./config.json');
const js = require('./json');
const fn = require('./fn');

exports.createUser = function createUser(id, nationIn, colorIn, passwordIn, sheet, map) {
    if (nationIn == undefined) {
        nationIn = "undefined";
    }
    if (colorIn == undefined) {
        colorIn = "undefined";
    }
    if (passwordIn == undefined) {
        passwordIn = "undefined";
    }
    if (sheet == undefined) {
        sheet = '11111114';
    }
    if (map == undefined) {
        map = 'www.x.com';
    }

    cfg.users[id] = {
        nation: nationIn, 
        color: colorIn, 
        password: passwordIn,
        sheet: sheet,
        map: map,
        notes: " ",
        egg: " "
    }
    js.exportFile("config.json", cfg);
    return true;
};
exports.exportFile = function exportFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
};
exports.perm = function perm(message, type) {
    let adm = cfg.servers[message.guild.id].administrators;
    let dev = cfg.servers[message.guild.id].developers;
    switch(type) {
        case 0:
            return true;
        case 1:
            if (adm.some(r=> message.member.roles.cache.has(r)) || dev.some(r=> message.member.roles.cache.has(r))) {
                return true;
            }
            message.reply("you do not have permission to do that. The Directorate for Distribution of information apologies.")
            return false;
        case 2:
            if (adm.some(r=> message.member.roles.cache.has(r))) {
                return true;
            }
            message.reply("you do not have permission to do that. The Directorate for Distribution of information apologies.")
            return false;
        default:
            message.reply("you do not have permission to do that. The Directorate for Distribution of information apologies.")
            return false;
    }
};