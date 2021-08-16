const {reject} = require ('./trade');
const {log} = require('../utils');
const {prefix} = require('../database.json');

module.exports = {
    name: 'reject',
    description: 'Command for rejecting trade transaction proposal!',
    args: 1,
    usage: `${prefix}reject [ID [USER]\nRejecting for other users can be done only by the moderators.`,
    cooldown: 5,
    guildOnly: true,
    execute: function transform(message, args, db) {
        reject(message, args, db).catch(error => log(error));
    }
};
