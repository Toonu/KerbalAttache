const cfg = require('./../config.json'), {log, report, perm} = require("../utils");
module.exports = {
    name: 'turn',
    description: 'Command for finishing turn and updating the sheet data!',
    args: 0,
    usage: `${cfg.prefix}turn`,
    cooldown: 5,
    guildOnly: true,
    execute: async function turn(message, args, db) {
        if(!perm(message, 2)) return;
    
        for (const user of db.users) {
            if (user.state) {
                user.state.turn(db, user);
            }
        }
        //Point of no return. Modifying real online data bellow.
        db.turn += 1;
        db.export();
        
        //Logging and announcing.
        report(message, `Turn ${cfg.turn} has been finished by <@${message.author.id}>.`, this.name);
        let server = cfg.servers[message.guild.id];
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        message.client.channels.cache.get(server.announcements)
        .send(`<@&${server.headofstate}> Turn ${cfg.turn} has been finished!`).catch(error => log(error, true));
    }
};