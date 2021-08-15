const cfg = require('./../config.json'), {log, report, perm} = require("../utils");
module.exports = {
    name: 'turn',
    description: 'Command for finishing turn and updating the sheet data!',
    args: 0,
    usage: `${cfg.prefix}turn`,
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
        report(message, `Turn ${db.turn} has been finished by ${message.author}.`, this.name);
        let server = cfg.servers[message.guild.id];
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        message.client.channels.cache.get(server.announcements)
        .send(`<@&${server.headofstate}> Turn ${db.turn} has been finished!`).catch(error => log(error, true));
    }
};