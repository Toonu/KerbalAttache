const {log, report, perm} = require("../utils");
const {prefix} = require('../database.json');

module.exports = {
    name: 'turn',
    description: 'Command for finishing turn and updating the states data!',
    args: 0,
    usage: `${prefix}turn`,
    cooldown: 5,
    guildOnly: true,
    execute: async function turn(message, args, db) {
        if(!perm(message, 2)) 
            return message.delete().catch(error => log(error, true));
        
        db.users.forEach(user => user.state ? user.state.turn(db, user) : undefined);
        db.loans.forEach(loan => loan.turn());
        db.turn += 1;
        
        //Exporting and reporting. Point of no return.
        db.export();
        db.exportSheet();
        report(message, `Turn ${db.turn} has been finished by ${message.author}.`, this.name);
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        message.client.channels.cache.get(db.channelAnnounce)
        .send(`<@&${db.headofstate}> Turn ${db.turn} has been finished!`).catch(error => log(error, true));
    }
};