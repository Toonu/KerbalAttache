const {ping, messageHandler, formatCurrency, log, resultOptions, embedSwitcher, report} = require("../utils"),
    {getCellArray, deleteRow} = require("../sheet"), cfg = require('../config.json');
const discord = require('discord.js');
module.exports = {
    name: 'sub',
    description: 'Command for getting information about user subscriptions. Persistent option set to true makes the list confirm.',
    args: 0,
    usage: `${cfg.prefix}sub [PERSIST] [USER]
    Persist set to 'true' will make the message persistant and it will never delete.
    
    Use ${cfg.prefix}sub del [CRAFT]
    to delete submission of craft.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function sub(message, args, db) {
        let isErroneous = false;
        let state = db.getState(ping(message, 2));

        if (!state)
            return messageHandler(message,
                new Error('NullReferenceException: User or his state does not exist!'), true);

        let submissionsData = await getCellArray('A1', cfg.submissionsEndCol, cfg.submissions)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        if (isErroneous) return;

        //Loop through all submission to find nation's submissions and trimming them to maximally 18 spaces.
        let nationSubmissions = [];
        let nationSubmissionsPosition = [];
        let maximalLength = 0;
        for (let row = 0; row < submissionsData.length; row++) {
            if (submissionsData[row][1] === state.name) {
                nationSubmissions.push(submissionsData[row]);
                nationSubmissionsPosition.push(row + 1);
                if (submissionsData[row][2].length > maximalLength) {
                    maximalLength = submissionsData[row][2].length;
                    if (maximalLength > 18) {
                        maximalLength = 18;
                    }
                }
            }
        }
        
        //Deleting submission switch.
        if (args[0] === 'del' && args[1]) {
            return await deleteSubmission(message, args, nationSubmissions, nationSubmissionsPosition, state);
        }

        //Parsing padding in case none of the submission crafts are longer than the header row padding.
        if (maximalLength < 5) {
            maximalLength = 5;
        }

        //Header line
        let displayResult = `[${"Asset".padStart(maximalLength === 5 ? 0 : maximalLength)}] Era ${"Class ".padEnd(11)}${"Price".padEnd(17)}${"Type".padEnd(31)}RU    Notes\n`;
        //Handling money and upgrades
        nationSubmissions.forEach(column => {
            let money = formatCurrency(column[24]);
            //Handles upgrades
            if (column[21] === 'Upgrade') column[21] += ` of ${column[22].substring(0, 18)}`;
            displayResult += `[${column[2].substring(0, 18).padStart(maximalLength)}] ${column[6]} ${(column[5]).padEnd(10)} ${money.padEnd(16)} ${column[21].padEnd(30)} ${Math.trunc(column[26]).toString().padEnd(5)} ${column[25]}\n`;
        });

        message.channel.send(`\`\`\`ini\n${displayResult}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
            .then(submissionMessages => {
                if (args.some(r => {if (r === 'true') return true})) {
                    submissionMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 32000})
                        .catch(error => log(error, true)));
                }
            })
            .catch(error => log(error, true));
        message.delete().catch(error => log(error, true));
    },
};


async function deleteSubmission(message, args, submissions, craftPosition, state) {
    //Parsing craft name if it contains spaces and shifting from first unneccessary arguments.
    let craft = args[1];
    await args.shift();
    await args.shift();
    args.forEach(arg => craft += ` ${arg}`);
    
    for (let i = 0; i < submissions.length; i++) {
        if (submissions[i][2].toLowerCase() === craft.toLowerCase()) {
            const embed = new discord.MessageEmbed()
            .setColor('#065535')
            .setTitle(`Confirm deleting the submission of ${craft}`)
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');
            
            function processReactions(reaction) {
                if (reaction.emoji.name === '✅') {
                    return resultOptions.confirm;
                } else if (reaction.emoji.name === '❌') {
                    return resultOptions.delete;
                }
            }
            
            function filterYesNo(reaction, user) {
                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
            }
            
            return await embedSwitcher(message, [embed], ['✅', '❌'], filterYesNo, processReactions)
            .then(result => {
                if (result === resultOptions.confirm) {
                    report(message, `${state.name} | ${message.author} has deleted submission ${craft}! Please delete the craft file from the storage manually.`, 'subDeletion');
                    messageHandler(message, 'Submission was deleted!', true);
                    deleteRow(craftPosition[i], cfg.submissions).catch(error => log(error, true));
                }
            })
            .catch(error => messageHandler(message, error, true));
        }
    }
    return messageHandler(message, 'NullReferenceException: Submission not found!', true);
}