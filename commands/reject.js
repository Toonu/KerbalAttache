const {reject} = require ('./trade'), cfg = require('./../config.json');
module.exports = {
    name: 'reject',
    description: 'Command for rejecting trade transaction proposal!',
    args: 1,
    usage: `${cfg.prefix}reject [ID [USER]\nRejecting for other users can be done only by the moderators.`,
    cooldown: 5,
    guildOnly: true,
    execute: function transform(message, args, db) {
        reject(message, args, db);
    }
};
