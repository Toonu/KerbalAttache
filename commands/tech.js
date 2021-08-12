// noinspection ExceptionCaughtLocallyJS,DuplicatedCode

const cfg = require('./../config.json'), {ping, log, messageHandler, report, findArrayData, embedSwitcher,
        resultOptions} = require('../utils'), tt = require('../dataImports/tt.json'), discord = require('discord.js'),
        {getCellArray, setCellArray, toColumn} = require("../sheet");

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
    option = (option === 'add');
    
    //Getting Research Budget column.
    let isErroneous = false;
    let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
    .catch(error => {
        isErroneous = true;
        return messageHandler(message, error, true);
    });
    if (isErroneous) {
        return;
    }
    
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
        isErroneous = true;
        log(`Cancelling tile process due to an error. Consult log for more information.`, true);
        return messageHandler(message, error, true);
    });
    if (isErroneous) {
        return;
    }

    report(message, `${nation}'s budget ${option ? 'modified by' : 'set to'} ${amount}!`, 'techBudget');
    messageHandler(message, 'Budget set!', true);
}

async function list(nation, message, searchItem) {
    let newMessage = [];
    let isErroneous = false;

    if (searchItem === undefined) {
        newMessage.push('\`\`\`ini\n');
        Object.keys(tt.categories).forEach(item => {
            newMessage.push(`[${item.padStart(20)}] ${tt.categories[item]}`);
        });
        newMessage.push(`\`\`\`\n\nOperation finished. All technology node categories are bellow:
        ***Note:*** You do not have to write full category name but merely it part is sufficient.`);
    } else if (tt[searchItem] !== undefined) {
        let node = tt[searchItem];
        
        let data = await getCellArray('A1', cfg.techEndCol, cfg.tech, true)
        .catch(error => {
            isErroneous = true;
            return messageHandler(message, error, true);
        });
        if (isErroneous) {
            return;
        }
    
        let nodeColumn;
        let endRow;
        try {
            nodeColumn = findArrayData(data, [searchItem], cfg.techMainRow)[searchItem];
            endRow = data[0].indexOf('Data');
            if (endRow === -1) {
                throw new Error('TechTree end Data node not found!');
            }
        } catch (error) {
            return messageHandler(message, error, true);
        }
    
        searchItem = searchItem.toLowerCase();
        // noinspection JSCheckFunctionSignatures
        const embed = new discord.MessageEmbed()
        .setColor('#065535')
        .setTitle(`Node ${tt[searchItem][0]}`)
        .setURL('https://discord.js.org/') //URL clickable from the title
        .setThumbnail('https://imgur.com/IvUHO31.png')
        .addFields(
            {name: 'Unlocks:', value: `\`\`\`\n${data[nodeColumn][endRow + 1]}\`\`\``},
            {name: 'Cost:', value: `${data[nodeColumn][endRow]}RP`, inline: true},
            {name: 'Buy?', value: `Press ✅`, inline: true},
        )
        .setFooter('Made by the Attachè to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');
    
        if (node[3].length !== 0) {
            embed.addField( 'Requirements:', node[3]);
        }
        
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
    
        await embedSwitcher(message, [embed], ['✅', '❌'], filterYesNo, processReactions)
        .then(result => {
            if (result === resultOptions.confirm) {
                research(message, searchItem, nation);
            }
        })
        .catch(error => messageHandler(message, error, true));
        
        return;
    } else if (tt.categories[searchItem] !== undefined) {
        //Constructs the message.
        newMessage.push(`Operation Finished.\n***Nodes in specified category ${searchItem}:***\n\n\`\`\`ini`);
        for (const element of Object.entries(tt).slice(1)) {
            if (element[1][2] && element[1][2].includes(searchItem)) {
                newMessage.push(`[${element[0]}] ${element[1][0]}`);
            }
        }
        if (!isErroneous) {
            newMessage.push('\`\`\`\nIn case of seeing only ini there, the category nor technology node was found.');
        }
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
    if (isErroneous) {
        return;
    }
    
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
    
    message.channel.send(`Unlocked nodes and their parts:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
    .then(assetMessages => {
        assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
        .catch(error => log(error, true)));
    })
    .catch(error => log(error, true));
    message.delete().catch(error => log(error, true));
}

async function research(message, node, nation) {
    let isErroneous = false;
    let isDeletion = false;
    
    if (node.startsWith('-')) {
        isDeletion = true;
        node = node.substring(1);
    }
    
    let nodeData = tt[node];
    if (!nodeData)
        return messageHandler(message, 'InvalidArgumentException: TechNode does not exist!', true);
    else if (node.substring(0, 2) > cfg.era || node.startsWith('early'))
        return messageHandler(message, 'TechNode is too futuristic!', true);
    
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
    if (isErroneous) {
        return;
    }
    
    let nationRow;
    let mainNationRow;
    let endRow;
    let nodeColumns;
    let mainColumns;
    try {
        mainNationRow = mainData[0].indexOf(nation);
        nationRow = data[0].indexOf(nation);
        endRow = data[0].indexOf('Data');
        nodeColumns = findArrayData(data, [node].concat(nodeData[3]), cfg.techMainRow);
        mainColumns = findArrayData(mainData, ['RP', 'Technology'], cfg.mainRow);
        mainColumns['Technology'] += nodeData[4];
        if (nationRow === -1 || endRow === -1 || mainNationRow === -1) {
            throw new Error( 'Row or column of node has not been found!');
        }
    } catch (error) {
        return messageHandler(message, error, true);
    }
    
    if (isDeletion && data[nodeColumns[node]][nationRow] === 1) {
        data[nodeColumns[node]][nationRow] = 0;
        mainData[mainColumns['RP']][mainNationRow] += data[nodeColumns[node]][endRow] * 0.7;
        mainData[mainColumns['Technology']][mainNationRow] -= 0.1;
    } else if (data[nodeColumns[node]][nationRow] === 0) {
        for (const nodeColumn of Object.values(nodeColumns).splice(1)) {
            if (data[nodeColumn][nationRow] === 0) {
                return messageHandler(message, `Prerequisite of ${data[nodeColumn][cfg.techMainRow]} is not fulfilled!`, true);
            }
        }
        data[nodeColumns[node]][nationRow] = 1;
        mainData[mainColumns['RP']][mainNationRow] -= data[nodeColumns[node]][endRow];
        mainData[mainColumns['Technology']][mainNationRow] += 0.1;
        if (mainData[mainColumns['RP']][mainNationRow] < 0) {
            return messageHandler(message, 'Not enough RP points!', true);
        }
    } else {
        return messageHandler(message, 'TechNode is already in the wanted state!', true);
    }
    
    await setCellArray(toColumn(mainColumns['RP']) + '1', [mainData[mainColumns['RP']]], cfg.main, true).catch(error => {
        log(error, true);
        isErroneous = true;
        return messageHandler(message, new Error('Error has occurred in assets tab.'), true);
    });
    if (isErroneous) {
        return;
    }
    await setCellArray(toColumn(mainColumns['Technology']) + '1', [mainData[mainColumns['Technology']]], cfg.main, true).catch(error => {
        log(error, true);
        isErroneous = true;
        return messageHandler(message, new Error('Error has occurred in assets tab.'), true);
    });
    if (isErroneous) {
        return;
    }
    await setCellArray(toColumn(nodeColumns[node]) + '1', [data[nodeColumns[node]]], cfg.tech, true).catch(error => {
        log(error, true);
        isErroneous = true;
        return messageHandler(message, new Error('Error has occurred in techTree tab.'), true);
    });
    if (isErroneous) {
        return;
    }
    
    report(message, `${message.author.username} has ${isDeletion ? 'deleted' : 'unlocked'}   ${tt[node][0]} for ${data[nodeColumns[node]][endRow]}!`, 'techResearch');
    messageHandler(message, `Node was ${isDeletion ? 'deleted' : 'unlocked'}!`, true);
}