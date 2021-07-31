const {ping} = require("../utils"), {getCellArray} = require("../sheet"),
    cfg = require('../config.json');
module.exports = {
    name: 'sub',
    description: 'Command for getting information about user subscriptions. Persistent option set to true makes the list stay.',
    args: 0,
    usage: `${cfg.prefix}sub [PERSIST] [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function sub(message, args) {
        let submissionsData = await getCellArray('A1', 'AA', cfg.submissions)
            .catch(error => {
                console.error(error);
                return message.channel.send(error)
                    .then(errorMessage => errorMessage.delete({timeout: 6000}).catch(error => console.error(error)))
                    .catch(error => console.error(error));
            });

        //Checks if the message has ping to determine searched nation.
        let nation = cfg.users[ping(message, 2).id].nation;

        //Loop filters out nation's submissions and pads them in the future with the longest one up to 18 spaces.
        let nationSubmissions = [];
        let maximalLength = 0;
        for (const row of submissionsData) {
            if (row[1] === nation) {
                nationSubmissions.push(row);
                if (row[2].length > maximalLength) {
                    maximalLength = row[2].length;
                    if (maximalLength > 18) {
                        maximalLength = 18;
                        break;
                    }
                }
            }
        }

        //Header line
        let displayResult = `${"[Asset]".padEnd(maximalLength)}   Era ${"Class ".padEnd(11)}${"Price".padEnd(16)}${"Notes".padEnd(20)}Range (in RU)\n`;

        //Handling money and upgrades
        nationSubmissions.forEach(column => {
            let money = column[24].toLocaleString(cfg.moneyLocale, { style: 'currency', currency: cfg.money });
            //Handles upgrades
            if (column[21] === 'Upgrade') column[21] += ` of ${column[22].substring(0, 18)}`;
            displayResult += `[${column[2].substring(0, 18).padStart(maximalLength)}] ${column[6]} ${(column[5]).padEnd(10)} ${money.padEnd(16)} ${column[21].padEnd(30)} ${column[26]}\n`;
        })

        message.channel.send(`\`\`\`ini\n${displayResult}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
            .then(submissionMessages => {
                if (args.some(r => {if (r === "true") return true})) {
                    submissionMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 32000})
                        .catch(error => console.error(error)));
                }
            })
            .catch(error => console.error(error));
        message.delete().catch(error => console.error(error));
    },
};