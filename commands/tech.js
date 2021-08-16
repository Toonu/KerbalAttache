// noinspection ExceptionCaughtLocallyJS,DuplicatedCode

const cfg = require('./../config.json'), tt = require('../dataImports/tt.json'),
    {ping, log, messageHandler, report, embedSwitcher, resultOptions, processYesNo} = require('../utils'),
    {TechNode} = require('../dataStructures/TechNode');

module.exports = {
    name: 'tech',
    description: 'Command for managing state research.',
    args: 0,
    usage: `${cfg.prefix}tech [OPERATION] [OPTION] [DATA] [USER]
    
Possible operations:

\`\`\`ini\n
OPERATION   OPTION      DATA
b | budget  [SET | ADD] [AMOUNT]        - Sets or adds money to user's research budget (use neg. number to decrease).
r | research            [NODE]          - Researches specified tech tree node.
list                                    - Lists all available categories.
list                    [CATEGORY]      - Lists all technological nodes in category.
list                    [NAME]          - Lists all information about a technological node.
u | unlocked                            - Shows information about everything you have unlocked. For specific node, use list.
\`\`\`
`,
    cooldown: 2,
    guildOnly: true,
    execute: async function tech(message, args, db) {
        let user = ping(message);
        let state = db.getState(user);
        
        if (!state) {
            return messageHandler(message, new Error('NullReferenceException: User\'s state not found. Canceling.'), true);
        }
        
        //Parsing arguments depending on the operation.
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
            case 'b':
                await budget(message, db, state, option, data);
                break;
            case 'r':
            case 'research':
                await research(message, db, state, data);
                break;
            case 'unlocked':
            case 'unlocks':
            case 'unlock':
            case 'u':
                await unlocks(message, state);
                break;
            case 'list':
            default:
                await list(message, db, state, data);
        }
    },
};


/**
 * Function changes state budget by or to amount depending on the option.
 * @param message
 * @param {exports.Database} db
 * @param {exports.State} state
 * @param {boolean|string} option   'set' or 'add' option to set or add to the budget.
 * @param {string|int} amount   parsable Int.
 * @returns {Promise<void>}
 */
async function budget(message, db, state, option, amount) {
    amount = parseInt(amount);
    //Validating input arguments.
    if (Number.isNaN(amount)) {
        return messageHandler(message, new Error('InvalidTypeException: Third argument is not a number!'), true);
    } else if (!['set', 'add'].includes(option.toLowerCase())) {
        return messageHandler(message, new Error('InvalidArgumentException: The option is not valid'), true);
    }
    
    //Setting budget depending on the option.
    try {
        option = (option === 'add');
        state.research.budget = option ? state.research.budget + amount : amount;
        db.export();
    } catch (error) {
        return messageHandler(message, error, true);
    }
    
    report(message, `${state.name}'s budget ${option ? 'modified by' : 'set to'} ${amount} by ${message.author}!`, 'techBudget');
    messageHandler(message, 'Budget set!', true);
}
async function unlocks(message, state) {
    let newMessage = '';
    state.research.toArray().forEach(r => newMessage += `${r}\n`);
    
    message.channel.send(`Unlocked nodes and their parts:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
    .then(assetMessages => {
        assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
        .catch(error => log(error, true)));
    })
    .catch(error => log(error, true));
    message.delete().catch(error => log(error, true));
}
async function research(message, db, state, nodeName) {
    let node = tt.nodes[nodeName.toLowerCase()];
    if (!node) {
        return messageHandler(message, new Error('NullReferenceException: Node does not exist!'), true) ;
    }
    
    node = new TechNode(nodeName, node.desc, node.cost, node.category, node.theatre, node.unlocks, node.prereq);
    
    try {
        state.research.unlockNode(node);
        db.export();
    } catch (error) {
        return messageHandler(message, error, true);
    }
    
    report(message, `${message.author} has unlocked ${node.desc} for ${node.cost}RP!`, 'techResearch');
    messageHandler(message, `Node was unlocked!`, true);
}
async function list(message, db, state, searchItem) {
    let newMessage = [];
    if (searchItem) {
        searchItem = searchItem.toLowerCase();
    }
    
    if (searchItem === undefined) {
        //Listing categories
        newMessage.push('\`\`\`ini\n');
        Object.keys(tt.categories).forEach(item => newMessage.push(`[${item.padStart(20)}] ${tt.categories[item]}`));
        newMessage.push(`\`\`\`\n\nOperation finished. All technology node categories are bellow:
        You can also search nodes in multiple categories by writing only part of category name.`);
    } else if (tt.nodes[searchItem] !== undefined) {
        //Listing node.
        let node = tt.nodes[searchItem];
        node = new TechNode(searchItem, node.desc, node.cost, node.category, node.theatre, node.unlocks, node.prereq);
        let nodeList = [];
        node.unlocks.forEach(item => nodeList.push(`\n${item}`));
        
        // noinspection JSCheckFunctionSignatures
        const embed = node.toEmbed();
    
        function filterYesNo(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }
    
        return await embedSwitcher(message, [embed], ['✅', '❌'], filterYesNo, processYesNo)
        .then(result => {
            if (result === resultOptions.confirm) {
                state.research.unlockNode(node);
                db.export();
            }
        })
        .catch(error => messageHandler(message, error, true));
    } else if (Object.keys(tt.categories).some(item => item.toLowerCase().includes(searchItem))) {
        //Lists nodes in a category.

        newMessage.push(`Operation Finished.\n***Nodes in specified category ${searchItem}:***\n\n\`\`\`ini`);
        for (const [name, element] of Object.entries(tt.nodes).slice(1)) {
            if (element.category.includes(searchItem)) {
                newMessage.push(`[${name}] ${element.desc} ! ${element.cost}RP`);
            }
        }
        newMessage.push(`\`\`\``);
    }
    if (newMessage.length > 2) {
        messageHandler(message, newMessage, true, 60000);
    } else {
        messageHandler(message, 'No data found. Please retry.', true, 60000);
    }
}


