const {ping, messageHandler, formatCurrency, log, resultOptions, embedSwitcher} = require("../utils"), {getCellArray, deleteRow} = require("../sheet"),
    cfg = require('../config.json');
const discord = require('discord.js');
const tt = require('./../tt.json');
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
    execute: async function sub(message, args) {
        let isErroneous = false;
        let nation = cfg.users[ping(message, 2).id];

        if (!nation)
            return messageHandler(message, new Error('InvalidArgumentException: User does not exist!'), true);
        nation = nation.nation;

        let submissionsData = await getCellArray('A1', cfg.submissionsEndCol, cfg.submissions)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        if (isErroneous) return;

        //Loop filters out nation's submissions and pads them in the future with the longest one up to 18 spaces.
        let nationSubmissions = [];
        let nationSubmissionsPosition = [];
        let maximalLength = 0;
        for (let row = 0; row < submissionsData.length; row++) {
            if (submissionsData[row][1] === nation) {
                nationSubmissions.push(submissionsData[row]);
                nationSubmissionsPosition.push(row + 1);
                if (submissionsData[row][2].length > maximalLength) {
                    maximalLength = submissionsData[row][2].length;
                    if (maximalLength > 18) {
                        maximalLength = 18;
                        break;
                    }
                }
            }
        }
        
        if (args[0] === 'del' && args[1]) {
            let craft = args[1];
            await args.shift();
            await args.shift();
            args.forEach(arg => craft += ` ${arg}`);
            
            for (let i = 0; i < nationSubmissions.length; i++) {
                if (nationSubmissions[i][2].toLowerCase() === craft.toLowerCase()) {
                    const embed = new discord.MessageEmbed()
                    .setColor('#065535')
                    .setTitle(`Confirm deleting the submission of ${craft}`)
                    .setURL('https://discord.js.org/') //URL clickable from the title
                    .setThumbnail('https://imgur.com/IvUHO31.png')
                    .setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');
    
                    function processReactions(reaction, embedMessage) {
                        if (reaction.emoji.name === '✅') {
                            return resultOptions.confirm;
                        } else if (reaction.emoji.name === '❌') {
                            return resultOptions.delete;
                        }
                    }
    
                    function filter(reaction, user) {
                        return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
                    }
    
                    await embedSwitcher(message, [embed], ['✅', '❌'], filter, processReactions)
                    .then(result => {
                        if (result === resultOptions.confirm) {
                            report(message, `<@${nation}> has deleted submission ${craft}! Please delete the craft file from the storage manually.`)
                            messageHandler(message, 'Submission was deleted!', true);
                            deleteRow(nationSubmissionsPosition[i], cfg.submissions).catch(error => log(error, true));
                        }
                    })
                    .catch(error => messageHandler(message, error, true));
                    return;
                }
            }
            return messageHandler(message, 'Submission not found!', true);
        }

        //Header line
        let displayResult = `${"[Asset]".padEnd(maximalLength)}   Era ${"Class ".padEnd(11)}${"Price".padEnd(16)}${"Notes".padEnd(20)}Range (in RU)\n`;

        //Handling money and upgrades
        nationSubmissions.forEach(column => {
            let money = formatCurrency(column[24]);
            //Handles upgrades
            if (column[21] === 'Upgrade') column[21] += ` of ${column[22].substring(0, 18)}`;
            displayResult += `[${column[2].substring(0, 18).padStart(maximalLength)}] ${column[6]} ${(column[5]).padEnd(10)} ${money.padEnd(16)} ${column[21].padEnd(30)} ${column[26]}\n`;
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