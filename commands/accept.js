const {accept} = require ('./trade');
const {log} = require("../utils");
const {prefix} = require('../database.json');

module.exports = {
    name: 'accept',
    description: 'Command for accepting trade transaction proposal!',
    args: 1,
    usage: `${prefix}accept [ID]`,
    cooldown: 5,
    guildOnly: true,
    execute: function transform(message, args, db) {
        accept(message, args, db).catch(error => log(error, true));
    }
};