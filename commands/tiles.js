const cfg = require("./../config.json"), {perm, messageHandler, report, log} = require("../utils");
module.exports = {
    name: 'tiles',
    description: 'Command for managing tile amount of a states.',
    args: 2,
    usage: `${cfg.prefix}tiles [ADDITION] [USER]
    
    Accepts decimal numbers to represent tiny tiles.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function tiles(message, args, db) {
        //Validating input arguments and clearance.
        if(!perm(message, 2))
            return message.delete().catch(error => log(error, true));

        let discordUser = message.mentions.users.first();
        let amount = parseFloat(args[0]);

        //Validating input arguments.
        if (Number.isNaN(amount)) {
            return messageHandler(message, new Error('InvalidTypeException: Argument is not a number. Canceling operation.'), true);
        } else if (!discordUser) {
            return messageHandler(message, new Error('InvalidArgumentException: No user specified. Canceling operation.'), true);
        }
        //Validating user existance.
        let dbUser = db.getUser(discordUser);
        if (!dbUser || !dbUser.state) {
            return messageHandler(message,
                new Error('InvalidArgumentException: User or his state not found. Canceling operation.'), true);
        }
        
        //Setting the tiles
        try {
            dbUser.state.tiles += amount;
            dbUser.state.tiles = parseFloat(dbUser.state.tiles.toFixed(2));
            db.export();
        } catch (error) {
            return messageHandler(message, error, true);
        }
        
        //Reporting.
        report(message, `Tiles set to ${dbUser.state.tiles} for ${dbUser.state.name} | <@${dbUser.user.id}> by ${discordUser}!`, this.name);
        messageHandler(message, 'Tiles set!', true);
    },
};