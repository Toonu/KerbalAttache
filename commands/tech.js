// noinspection ExceptionCaughtLocallyJS

const cfg = require('./../config.json'), {ping, log, messageHandler, report, findArrayData, embedSwitcher,
        resultOptions
    } = require('../utils'),
    tt = require('./../tt.json'), discord = require('discord.js'),
    {getCellArray, setCellArray, toColumn} = require("../sheet");
const {testing} = require('googleapis/build/src/apis/testing');
module.exports = {
    name: 'tech',
    description: 'Command for managing your research.',
    args: 0,
    usage: `${cfg.prefix}tech [OPERATION] [OPTION] [DATA] [USER]
    
Possible operations:

\`\`\`ini\n
OPERATION   OPTION      DATA
budget      [SET | ADD] [AMOUNT]        - Sets or adds money to user's research budget (use neg. number to decrease).
research                [NODE | -NODE]  - Researches specified tech tree node. Use minus letter to revert research.
list                                    - Lists all available categories.
list                    [CATEGORY]      - Lists all technological nodes in category.
list                    [NAME]          - Lists all information about a technological node.
unlocked                                - Shows information about everything you have unlocked. For specific node, use list.
\`\`\`
`,
    cooldown: 2,
    guildOnly: true,
    execute: async function tech(message, args) {
        let user = ping(message);
        
        if (!cfg.users[user.id]) {
            return messageHandler(message, new Error('User not found. Canceling.'), true);
        }
        
        let nation = cfg.users[user.id].nation;
        
        let operation = args[0];
        let option;
        let data;
        if (args[2]) {
            option = args[1];
            data = args[2];
        } else {
            data = args[1];
        }
        
        switch (operation) {
            case 'budget':
                await budget(message, option, data, nation);
                break;
            case 'list':
                await list(nation, message, data);
                break;
            case 'unlocked':
                await unlocks(message, nation);
                break;
            case 'research':
                await research(message, data, nation);
                break;
            default:
                messageHandler(message, new Error('Wrong operation specified! Please retry.'), true);
        }
    },
};

async function budget(message, option, amount, nation) {
    amount = parseInt(amount);
    if (Number.isNaN(amount)) {
        return messageHandler(message, new Error('InvalidTypeException: Third argument is not a number!'), true);
    } else if (!['set', 'add'].includes(option.toLowerCase())) {
        return messageHandler(message, new Error('InvalidArgumentException: The option is not valid'), true);
    }
    option = option === 'add';
    
    //Getting Research Budget column.
    let isErroneous = false;
    let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
    .catch(error => {
        isErroneous = true;
        return messageHandler(message, error, true);
    });
    if (isErroneous) return;
    
    let rbColumn;
    let nationRow = data[0].indexOf(nation);
    try {
        rbColumn = findArrayData(data, ['ResBudget'], cfg.mainRow)['ResBudget'];
        if (nationRow === -1) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Could not find research or nation cell.');
        }
    } catch (error) {
        return messageHandler(message, error, true);
    }
    
    data[rbColumn][nationRow] = option ? data[rbColumn][nationRow] + amount : amount;
    if (data[rbColumn][nationRow] < 0) {
        return messageHandler(message, new Error('InvalidArgumentException: Cannot set budget to negative' +
            ' number!'), true);
    }

    await setCellArray( `${toColumn(rbColumn)}1`, [data[rbColumn]], cfg.main, true)
    .catch(error => {
        // noinspection ReuseOfLocalVariableJS
        isErroneous = true;
        log(`Cancelling tile process due to an error. Consult log for more information.`, true);
        return messageHandler(message, error, true);
    });
    if (isErroneous) return;

    report(message, `${nation}'s budget ${option ? 'modified by' : 'set to'} ${amount}!`, 'techBudget');
    messageHandler(message, 'Budget set!', true);
}

async function list(nation, message, searchItem) {
    let newMessage = [];
    let isErroneous = false;

    if (searchItem === undefined) {
        newMessage.push('\`\`\`ini\n')
        Object.keys(tt.categories).forEach(item => {
            newMessage.push(`[${item.padStart(20)}] ${tt.categories[item]}`);
        })
        newMessage.push(`\`\`\`\n\nOperation finished. All technology node categories are bellow:
        ***Note:*** You do not have to write full category name but merely it part is sufficient.`);
    } else if (tt[searchItem] !== undefined) {
        let node = tt[searchItem];
        
        let data = await getCellArray('A1', cfg.techEndCol, cfg.tech, true)
        .catch(error => {
            isErroneous = true;
            return messageHandler(message, error, true);
        });
        if (isErroneous) return;
        
        try {
            const nodeColumn = findArrayData(data, [searchItem], cfg.techMainRow);
            const endRow = data[0].indexOf('Data');
            if (endRow === -1) {
                throw new Error('TechTree end Data node not found!');
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }
    
        searchItem = searchItem.toLowerCase();
        const embed = new discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`Node ${tt[searchItem][0]}`)
        .setURL('https://discord.js.org/') //URL clickable from the title
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .addFields(
            {name: 'Unlocks:', value: `\`\`\`\n${data[nodeColumn][endRow]}\`\`\``},
            {name: 'Cost:', value: `${data[nodeColumn][endRow + 1]}RP`, inline: true},
            {name: 'Buy?', value: `✅`, inline: true},
        )
        .setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');
        
        function filter(reaction, user) {
            return ((reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id);
        }
        
        function processReactions(reaction, embedMessage) {
            if (reaction.emoji.name === '✅️') {
                return resultOptions.confirm;
            } else if (reaction.emoji.name === '❌') {
                return resultOptions.delete;
            }
        }
    
        await embedSwitcher(message, [embed], ['✅', '❌'], filter, processReactions)
        .then(result => {
            if (result === resultOptions.confirm) {
                research(message, node, nation);
            }
        })
        .catch(error => messageHandler(message, error, true));
    } else if (tt.categories[searchItem] !== undefined) {
        //Constructs the message.
        newMessage.push(`Operation Finished.\n***Nodes in specified category ${searchItem}:***\n\n\`\`\`ini`);
        for (const element of Object.entries(tt).slice(1)) {
            if (element[1][2] && element[1][2].includes(searchItem)) {
                newMessage.push(`[${element[0]}] ${element[1][0]}`);
            }
        }
        
        newMessage.push('\`\`\`\nIn case of seeing only ini there, the category nor technology node was found.');
    }
    
    messageHandler(message, newMessage, true, 60000);
}

async function unlocks(message, nation) {
    const unlocks = [];
    let newMessage = '';
    let isErroneous = false;
    
    let data = await getCellArray('A1', cfg.techEndCol, cfg.tech, true)
    .catch(error => {
        isErroneous = true;
        return messageHandler(message, error, true);
    });
    if (isErroneous) return;
    
    let nationRow = data[0].indexOf(nation);
    let endRow = data[0].indexOf('Data');
    
    if (nationRow === -1 || !endRow) {
        return messageHandler(message, new Error('One of columns could not be found.'), true);
    }
    
    let maxLength = 0;
    for (const column of data) {
        if (column[nationRow] === 1) {
            unlocks.push([column[cfg.techMainRow], column[endRow + 1], column[endRow]]);
            if (maxLength < tt[column[cfg.techMainRow]][0].length) {
                maxLength = tt[column[cfg.techMainRow]][0].length;
            }
        }
    }
    
    //Constructs the message.
    unlocks.forEach(item => {
        newMessage += `[${tt[item[0]][0].padStart(maxLength)}] ${item[1]} |${item[2]}RP\n`;
    });
    
    messageHandler(message, `Unlocked nodes and their parts:\n\`\`\`ini\n${newMessage}\`\`\``, true, 90000);
}

async function research(message, node, nation) {
    let isErroneous = false;
    let isDeletion = false;
    
    if (node.startsWith('-')) {
        isDeletion = true;
        node = node.substring(1);
    }
    
    let nodeData = tt[node];
    if (!nodeData) {
        return messageHandler(message, 'InvalidArgumentException: Node does not exist!', true);
    }
    
    let data = await getCellArray('A1', cfg.techEndCol, cfg.tech, true)
    .catch(error => {
        isErroneous = true;
        return messageHandler(message, error, true);
    });
    let mainData = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
    .catch(error => {
        isErroneous = true;
        return messageHandler(message, error, true);
    });
    if (isErroneous) return;
    
    let nationRow;
    let mainNationRow;
    let endRow;
    let nodeColumns;
    let rpColumn;
    try {
        mainNationRow = mainData[0].indexOf(nation);
        nationRow = data[0].indexOf(nation);
        endRow = data[0].indexOf('Data');
            nodeColumns = findArrayData(data, [node].concat(nodeData[3]), cfg.techMainRow);
        rpColumn = findArrayData(mainData, ['RP'], cfg.mainRow)['RP'];
        if (nationRow === -1 || endRow === -1 || mainNationRow === -1) {
            throw new Error( 'Row or column of node has not been found!');
        }
    } catch (error) {
        return messageHandler(message, error, true);
    }
    
    if (isDeletion) {
        data[nodeColumns[node]][nationRow] = 0;
        mainData[rpColumn][mainNationRow] += data[nodeColumns[node]][endRow] * 0.7;
    } else {
        for (const nodeColumn of Object.values(nodeColumns)) {
            if (data[nodeColumn][nationRow] === 0) {
                return messageHandler(message, `Prerequisite of ${data[nodeColumn][cfg.techMainRow]} is not fulfilled!`, true);
            }
        }
        data[nodeColumns[node]][nationRow] = 1;
        mainData[rpColumn][mainNationRow] = mainData[rpColumn][mainNationRow] - data[nodeColumns[node]][endRow];
        if (mainData[rpColumn][mainNationRow] < 0) {
            return messageHandler(message, 'Not enough RP points!', true);
        }
    }
    
    await setCellArray(toColumn(rpColumn) + '1', [mainData[rpColumn]], cfg.main, true).catch(error => {
        log(error, true);
        isErroneous = true;
        return messageHandler(message, new Error('Error has occurred in assets tab.'), true);
    });
    if (isErroneous) return;
    await setCellArray(toColumn(nodeColumns[node]) + '1', [data[nodeColumns[node]]], cfg.tech, true).catch(error => {
        log(error, true);
        isErroneous = true;
        return messageHandler(message, new Error('Error has occurred in techTree tab.'), true);
    });
    if (isErroneous) return;
    
    report(message, `${message.author.username} has ${isDeletion ? 'deleted' : 'unlocked'}   ${tt[node][0]} for ${data[nodeColumns[node]][endRow]}!`, 'techResearch');
    messageHandler(message, `Node was ${isDeletion ? 'deleted' : 'unlocked'}!`, true);
}