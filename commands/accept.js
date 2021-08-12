const {accept} = require ('./trade'), cfg = require('./../config.json');
const {log} = require("../utils");
module.exports = {
    name: 'accept',
    description: 'Command for accepting trade transaction proposal!',
    args: 1,
    usage: `${cfg.prefix}accept [ID]`,
    cooldown: 5,
    guildOnly: true,
    execute: function transform(message, args, db) {
        accept(message, args, db).catch(error => log(error, true));
    }
};