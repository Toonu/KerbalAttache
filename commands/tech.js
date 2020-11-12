const cfg = require('./../config.json'), {ping, perm, exportFile} = require('../jsonManagement'),
    tt = require('./../tt.json'), discord = require('discord.js'),
    {get, set, getArray, toCoordinate, fromCoordinate} = require("../sheet"),
    {findData, findHorizontal, findVertical, report} = require("../game");
module.exports = {
    name: 'tech',
    description: 'Command for managing your research.',
    args: true,
    usage: `[operation] [operation type] [operation data] [M:@user]
Possible operations:

**budget [set | add]**          - Sets or adds money to user's research budget (use neg. number to decrease).
**research [node | -node]**     - Researches specified tech tree node. Use minus letter to revert research.
**list**                        - Lists all available categories.
**list [category]**             - Lists all technological nodes in category.
**list [node]**                 - Lists all information about technological node.
**unlocked**                    - Shows information about everything you have unlocked. For specific node, use list.
**change [node] [type] [data]** - Moderator configuration options.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function tech(message, args) {
        let del = 1;
        let nation = cfg.users[(await ping(message)).id].nation;
        let result = [];
        if (args[0] === 'budget') {
            let amount = parseInt(args[2]);
            if (['set', 'add'].includes(args[1]) && !isNaN(amount)) {
                let bool = (args[1] === 'set') ? 0 : 1;
                result.push(await budget(amount, nation, bool));
                result.push(true);
            } else {
                result.push('Argument is not a number or operation is not set/add. Canceling operation.');
                result.push(false);
            }
        } else if (args[0] === 'list') {
            result.push(await list(args[1], nation, message));
            result[0].startsWith('Operation') ? result.push(false) : result.push(true);
        } else if (args[0] === 'unlocked') {
            result.push(await unlocks(nation));
            result.push(false);
        } else if (args[0] === 'research') {
            if (parseInt(args[1].substring(0, 2)) >= cfg.era || (args[1].startsWith('Early') && cfg.era === 50)) {
                result.push('The technology is too futuristic!');
                result.push(false);
            } else {
                if (args[1].startsWith('-') && perm(message, 2)) {
                    // noinspection ReuseOfLocalVariableJS
                    del = 0;
                    args[1] = args[1].substring(1, args[1].length);
                }
                try {
                    let res = await research(args[1].toLowerCase(), nation, del)
                    result.push(res);
                    result.push(true);
                } catch(e) {
                    result.push(e);
                    result.push(false);
                }
            }
        } else if (args[0] === 'change') {
            if (tt[args[1]] === undefined) {
                result.push('Operation failed.');
                result.push(false);
            } else {
                let ch = change(args)
                result.push(ch);
                result.push(true);
            }
        }

        message.channel.send(result[0], {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}}).then(msg => {
            if (msg.length < 5) {
                msg.forEach(m => {
                    m.delete({timeout: 32000})
                });
            } else {
                msg.delete({timeout: 32000});
            }
        });
        if (result[1]) {
            report(message, `${result[0]} by <@${message.author.id}> for ${nation}!`, `${this.name} ${args[0]}`);
        }
        return message.delete();
    },
};


/**
 * Function modifies user's budget in the main sheet.
 * @param amount                    Number amount to add or set.
 * @param nation                    String Nation name for budget that is modified.
 * @param add                       If budget is added or set to the original one [1 | 0]
 * @return {Promise<String>}        Returns String message about the success of the operation.
 */
function budget(amount, nation, add) {
    return new Promise(function (resolve, reject) {
        findData('ResBudget', nation)
            .then(data => {
                if (data[3] === false) data[3] = 0;
                let budget = data[3]*add + amount;
                if (budget < 0) reject('Budget cannot be set lower than 0!');
                set(`${data[1]+data[2]}`, budget).then(() => {
                    resolve(`Research budget modified to ${budget.toLocaleString(`fr-FR`, { style: 'currency', currency: cfg.money })}`);
                }).catch(err => {
                    reject(err);
                });
            })
            .catch(err => reject(err));
    })
}


/**
 * Function lists all nodes in specified category.
 * @param category              String category name. If undefined, prints all categories.
 * @param nation                Modified User's nation name String
 * @param message               Message for embed filtering.
 * @return {Promise<String>}    Returns String message about the success of the operation.
 */
function list(category, nation, message) {
    return new Promise(function (resolve) {
        let newMessage = '';

        if(category === undefined) {
            Object.keys(tt.categories).forEach(item => {
                newMessage += `[${item.padStart(20)}] ${tt.categories[item]}\n`;
            })
            resolve(`Operation finished. All technology node categories are bellow:
            ***Note:*** You do not have to write full category name but merely it part is sufficient.
            \`\`\`ini\n${newMessage}\`\`\``);
        }

        category = category.toLowerCase();

        if (tt[category] !== undefined) {
            findData(category, nation, true, 'TechTree').then(data => {
                let unlocks = data[0][1][0].split(',');
                unlocks.forEach(r => {
                    newMessage += `${r.trim()}\n`
                })
                // noinspection JSCheckFunctionSignatures
                const embed = new discord.MessageEmbed()
                    .setColor('#065535')
                    .setTitle(`Node ${tt[category][0]}`)
                    .setURL('https://discord.js.org/') //URL clickable from the title
                    .setThumbnail('https://imgur.com/IvUHO31.png')
                    .addFields(
                        { name: 'Unlocks:', value: `\`\`\`${newMessage}\`\`\``},
                        { name: 'Cost:', value: `${data[0][0]}RP`, inline: true},
                        { name: 'Buy?', value: `✅`, inline: true},
                    )
                    .setFooter('Made by the Attaché to the United Nations.\nThis message will be auto-destructed in 32 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');

                function filter(reaction, user) {
                    return ((reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id);
                }

                message.channel.send(embed)
                    .then(msg => {
                        msg.react('✅').catch(err => console.log(err));
                        msg.react('❌').catch(err => console.log(err));
                        msg.awaitReactions(filter, { max: 1, time: 32000, errors: ['time'] })
                            .then(collected => {
                                let react = collected.first();
                                if (react.emoji.name === '✅') {
                                    research(category, nation).then(result => {
                                        resolve(result);
                                    })
                                }
                                msg.delete();
                                resolve('Operation canceled.');
                            })
                            .catch(() => {
                                msg.delete();
                                resolve('Operation timed out.');
                            })
                    }).catch(err => resolve(err));
            }).catch(err => resolve(err));
        } else {
            let nodes = [];
            for (const [key, value] of Object.entries(tt)) try {
                if (value[2].toLowerCase().includes(category)) {
                    nodes.push(key);
                }
            } catch (e) {}

            //If category is not exact, assign user input as category name.
            let ctg = tt.categories[category];
            if (ctg === undefined) ctg = category;

            //Edits the node list to print with padding.
            let l = 0;
            nodes.forEach(item => {
                if (item.length > l) l = item.length;
            });

            //Constructs the message.
            nodes.forEach(item => newMessage += `[${item.padStart(l)}] ${tt[item][0]}\n`);
            resolve(`Operation Finished.\n***Nodes in specified category ${ctg}:***\n\n\`\`\`ini\n${newMessage}\`\`\`
            In case of seeing only ini there, the category nor technology node was found.`);
        }
    })
}


/**
 * Function lists all unlocked assets of nodes of specified nation.
 * @param nation                    String nation's name.
 * @return {Promise<String>}       String of all unlocked assets.
 */
function unlocks(nation) {
    return new Promise(async function (resolve, reject) {
        const unlocks = [];
        let nodes;
        let data;
        let names;
        let newMessage = '';
        try {
            let nationRow = await findVertical(nation, 'A');
            let dataRow = await findVertical('Data', 'A', 'TechTree');
            nodes = await getArray(`A${nationRow}`, `HO${nationRow}`, 0, 0, 'TechTree');
            data = await getArray(`A${dataRow}`, `HO${dataRow}`, 0, 1, 'TechTree');
            names = await getArray('A4', 'HO4', 0, 0, 'TechTree');
        } catch (e) {
            reject(e);
        }

        for(let i = 1; i < nodes[0].length; i++) {
            if (nodes[0][i] === '1') {
                unlocks.push([names[0][i], data[1][i]])
            }
        }
        //Edits the unlocks list to print with padding.
        let l = 0;

        unlocks.forEach(item => {
            if (tt[item[0]][0].length > l) {
                l = tt[item[0]][0].length;
            }
        });
        //Constructs the message.
        unlocks.forEach(item => {
            newMessage += `[${tt[item[0]][0].padStart(l)}] ${item[1]}\n`;
        });
        resolve(`Unlocked nodes and their parts:\n\`\`\`ini\n${newMessage}\`\`\``);
    })
}


/**
 * Function researches or deletes a node.
 * @param node                  String node name.
 * @param nation                Nation to modify.
 * @param del                   If remove or add a node.
 * @return {Promise<String>}    Result String.
 */
function research(node, nation, del = 1) {
    return new Promise(async function (resolve, reject) {
        try {
            if (del === 1) {
                for await (const r of tt[node][3]) {
                    await findData(r, nation, true, 'TechTree')
                        .then(unlocked => {
                            if (unlocked[0] === 0) throw 'You do not have the prerequisites to unlock the node!';
                        })
                }
            }
        } catch (err) {
            console.log(err);
            return reject(err);
        }

        //Checking node
        let data = await findData(node, nation, true, 'TechTree').catch(e => {reject(e)});
        if (del && parseInt(data[3]) === 1) return reject('Node already unlocked!');

        //Checking rp amount
        let rpCol = await findHorizontal('RP', 4).catch(e => {reject(e)});
        let rp = parseInt((await get(`${rpCol + data[2]}`)).replace(/[,]/g, ''));
        if (data[0][0] > rp && del !== 0) return reject('Not enough Research Points!');

        //Setting node to 1 and then setting RP
        let result = await set(`${data[1] + data[2]}`, del, 'TechTree').catch(e => {reject(e)});
        if (result) {
            if (del === 1) set(`${rpCol + data[2]}`, rp - data[0][0]).catch(e => {reject(e)});

            //Tech increments change
            let increments = await findHorizontal('Technology', 4).catch(e => {reject(e)});
            let incrementArray = await getArray(`${increments}5`, `${increments}5`, 4, data[2] - 5).catch(e => {reject(e)});
            let from = fromCoordinate(increments);
            let coordinate = toCoordinate(from[0] + tt[node][4]);
            if (del === 1) {
                await set(`${coordinate  + data[2]}`, (parseFloat(incrementArray[0][tt[node][4]]) + 0.1)).catch(e => {reject(e)});
                resolve(`${tt[node][0]} was unlocked for ${data[0][0]}RP`)
            } else {
                await set(`${coordinate + data[2]}`, (parseFloat(incrementArray[0][tt[node][4]]) - 0.1)).catch(e => {reject(e)});
                resolve(`${tt[node][0]} was removed from ${nation}`);
            }
        }
        return reject('Operation failed!');
    });
}


/**
 * Function changes node internal configuration (not on sheet tho).
 * @param data          Args array
 * @return {string}     Result message
 */
function change(data) {
    let newData = '';
    data.forEach(r => {
        if(r !== data[0] && r !== data[1] && r !== data[2]) {
            newData += r + ' ';
        }
    })

    if (data[2] === 'name') {
        tt[data[1]][0] = newData.trim();
    } else if (data[2] === 'category') {
        tt[data[1]][2] = data[3];
        newData = data[3];
    } else if (data[2] === 'reqadd') {
        tt[data[1]][3].push(data[3]);
        newData = data[3];
    } else if (data[2] === 'reqdel') {
        for (let i = 0; i < tt[data[1]][3].length; i++) {
            if (tt[data[1]][3][i] === data[3]) {
                tt[data[1]][3].splice(i, 1);
            }
        }
        newData = undefined;
    }
    exportFile("tt.json", tt);
    return `${data[1]} ${data[2]} was changed to ${newData}`;
}
