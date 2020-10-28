const fs = require('fs');
const cfg = require('./config.json');

exports.createUser = function createUser(message, nationIn, colorIn, passwordIn) {    
    const id = message.mentions.users.map(user => {
        return user.id;
    });

    if (nationIn == undefined) {
        nationIn = "undefined";
    }
    if (colorIn == undefined) {
        colorIn = "undefined";
    }
    if (passwordIn == undefined) {
        passwordIn = "undefined";
    }

    if (cfg.users[id] == undefined) {
        cfg.users[id] = {
            nation: nationIn, 
            color: colorIn, 
            password: passwordIn,
            notes: " ",
            egg: " "
        }
        js.exportFile("config.json", cfg);
        return true;
    }
    return false;
};
exports.modifyUser = function modifyUser(message, user, type, data) {
    switch(type) {
        case "0":
            cfg.users[user].nation = data;
            break;
        case "1":
            cfg.users[user].color = data;
            break;
        case "2":
            cfg.users[user].password = data;
            break;
        case "3":
            cfg.users[user].notes = data;
            break;
        case 0:
            cfg.users[user].egg = data;
            break;
        default:
            return false;
    }

    exportFile("config.json", cfg);
    return true;
};
exports.delUser = function delUser(user) {
    delete cfg.users[user];
    exportFile("config.json", cfg);
};
exports.exportFile = function exportFile(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
};
exports.perm = function perm(message, type) {
    switch(type) {
        case 0:
            return true;
        case 1:
            if (cfg.administrators.some(r=> message.member.roles.cache.has(r)) || cfg.developers.some(r=> message.member.roles.cache.has(r))) {

                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        case 2:
            if (cfg.administrators.some(r=> message.member.roles.cache.has(r))) {
                return true;
            }
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
        default:
            message.reply("You do not have permissions to do that. The Directorate for Distribution of information apologies.")
            return false;
    }
};