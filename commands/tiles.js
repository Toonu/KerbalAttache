const cfg = require("./../config.json"), {getCellArray, setCellArray, toColumn} = require("../sheet"), {perm, messageHandler, log, report} = require("../utils");
module.exports = {
    name: 'tiles',
    description: 'Command for managing tile amount of a specified nation.',
    args: 2,
    usage: `${cfg.prefix}tiles [ADDITION] [USER]
    
    Accepts decimal numbers to represent tiny tiles.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function tiles(message, args) {
        let user = message.mentions.users.first().id;
        args[0] = parseFloat(args[0]);

        //Checking arguments and permissions.
        if (!perm(message, 2)) return message.delete().catch(error => log(error, true));
        else if (isNaN(args[0])) return messageHandler(message, new Error('InvalidTypeException: Argument is not a number. Canceling operation.'), true);
        else if (user === undefined) return messageHandler(message, new Error('InvalidArgumentException: No user specified. Canceling operation.'), true);

        let column = 0;
        let row = 0;
        let isErroneous = false;
        let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });

        if (isErroneous) return;

        for (column; column < data.length; column++) {
            // noinspection JSUnresolvedVariable
            if (data[column][cfg.mainRow].toLowerCase() === 'tiles') break;
        }
        for (row; row < data[0].length; row++) {
            if (data[0][row] === cfg.users[user].nation) break;
        }
        data[column][row] += args[0];
        if (data[column][row] > 0) {
            await setCellArray( `${toColumn(column)}1`, [data[column]], cfg.main, true)
                .catch(error => {
                    // noinspection ReuseOfLocalVariableJS
                    isErroneous = true;
                    log(`Cancelling tile process due to an error. Consult log for more information.`, true);
                    return messageHandler(message, error, true);
                });

            if (isErroneous) return;

            //Logging and announcing.
            report(message, `Tiles set to ${data[column][row]} for ${cfg.users[user].nation} by <@${message.author.id}>!`, this.name);
            messageHandler(message, 'Tiles set!', true);
        } else {
            messageHandler(message, new Error('Tiles cannot go into negative numbers. Canceling operation.'), true);
        }
    },
};