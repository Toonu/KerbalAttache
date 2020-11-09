const cfg = require('./../config.json'), {ping, perm} = require('../jsonManagement'), tt = require('./../tt.json'),
    {get, set, getArray, toCoordinate} = require("../sheet"), discord = require('discord.js'),
    {findData, findHorizontal, findVertical, report} = require("../game");
module.exports = {
    name: 'tech',
    description: 'Command for managing your research!',
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
        let nation = cfg.users[ping(message).id].nation;
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
        } else if (args[0] === 'unlocks') {
            result.push(await unlocks(nation));
            result.push(false);
        }




        else if (args[0] === 'research') {
            if (parseInt(args[1].substring(0, 2)) >= cfg.era) {
                message.channel.send('The technology is too futuristic!').then(msg => msg.delete({timeout: 5000}));
                return message.delete();
            }
            research(args[1].toLowerCase(), nation, message);

        } else if (args[0] === 'change') {
            let ch = change(args)
            if (ch[0]) {
                report(message, `${message.author.username} has changed the ${args[1]} ${args[2]} to ${ch[1]}!`)
            } else {
                message.channel.send('Operation failed.');
            }
        }


        if (result[0]) {
            message.channel.send(result[0], {split: 'true'}).then(msg => {
                if (msg.length < 5) {
                    msg.forEach(m => {
                        m.delete({timeout: 16000})
                    });
                } else {
                    msg.delete({timeout: 16000});
                }
            });
            if (result[1]) {
                report(message, `${result} by <@${message.author.id}>!`);
            }
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
                    resolve(`Research budget modified to ${budget.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })}`);
                }).catch(err => {
                    reject(err);
                });
            })
            .catch(err => reject(err));
    })
}


/**
 * Function lists all nodes in specified category.
 * @param category      String category name. If undefined, prints all categories.
 * @param nation        Modified User's nation name String
 * @param message       Message for embed filtering.
 * @return {string}     Returns String message about the success of the operation.
 */
function list(category, nation, message) {
    return new Promise(function (resolve, reject) {
        let newMessage = '';

        if(category === undefined) {
            Object.keys(tt.categories).forEach(item => {
                newMessage += `[${item.padStart(20)}] ${tt.categories[item]}\n`;
            })
            resolve(`Operation finished. All technology node categories are bellow:
            ***Note:*** You do not have to write full category name but merely it part is sufficient.
            \`\`\`ini\n${newMessage}\`\`\`
            `);
        }

        category = category.toLowerCase();

        if (tt[category] !== undefined) {
            findData(category, nation, true, 'TechTree').then(data => {
                let unlocks = data[0][1].split(',');
                unlocks.forEach(r => {
                    newMessage += `${r.trim()}\n`
                })
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
                        msg.react('✅');
                        msg.react('❌')
                        msg.awaitReactions(filter, { max: 1, time: 32000, errors: ['time'] })
                            .then(collected => {
                                let react = collected.first();
                                if (react.emoji.name === '✅') {
                                    research(category, nation, message).then(result => {
                                        resolve(result);
                                    })
                                }
                                msg.delete();
                                resolve('Operation canceled.');
                            })
                            .catch(err => {
                                msg.delete();
                                resolve('Operation timed out.');
                            })
                    }).catch(err => console.log(err));
            }).catch(err => console.log(err));
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
            resolve(`Operation Finished.\n***Nodes in specified category ${ctg}:***\n\n\`\`\`ini\n${newMessage}\`\`\``);
        }
    })
}


function unlocks(nation) {
    return new Promise(async function (resolve, reject) {
        const unlocks = [];
        let nationRow;
        let nodes;
        let dataRow;
        let data;
        let names;
        try {
            nationRow = await findVertical(nation, 'A');
            nodes = await getArray(`A${nationRow}`, `HO${nationRow}`, 0, 0, 'TechTree');
            dataRow = await findVertical('Data', 'A', 'TechTree');
            data = await getArray(`A${dataRow}`, `HO${dataRow}`, 1, 2, 'TechTree');
            names = await getArray('A4', 'HO4', 0, 0, 'TechTree');
        } catch (e) {
            reject(e);
        }

        for(let i = 1; i < nodes[0].length; i++) {
            if (nodes[0][i] === '1') {
                unlocks.push([names[0][i], data[1][i]])
            }
        }

        let newMessage = '';

        //Edits the node list to print with padding.
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


async function research(node, nation, message) {
    const tt = require('./../tt.json');
    let nationRP;
    let del = 1;
    if (node.startsWith('-') && perm(message, 2)) {
        del = 0;
        node = node.substring(1, node.length);
    }

    //Checking prerequisites
    try {
        for await (const r of tt[node][3]) {
        await findData(r, nation, true, 'TechTree')
            .then(unlocked => {
                //console.log(r);
                if(unlocked[3] === '0') throw 'You do not have the prerequisites to unlock the node!';
            })
        } 
    } catch(err) {
        message.channel.send(err);
        return;
    }
    
    //Checking node
    findData(node, nation, true, 'TechTree')
        .then(data => {
            if (del && parseInt(data[3]) === 1) {
                message.channel.send('Node already unlocks!');
                return false;
            }
            //Checking rp amount
            findHorizontal('RP', 4)
                .then(rpCol => {
                    get(`${toCoordinate(rpCol)+data[2]}`)
                        .then(rp => {
                            nationRP = rp
                            if (data[0] > rp && del !== 0) {
                                message.channel.send('Not enough Research Points!');
                                return false;
                            }
                            //Setting node and then RP
                            set( `${data[1]+data[2]}`, del, 'TechTree')
                                .then(result => {
                                    if (result) {
                                        if (del === 1) {
                                            message.channel.send('Node unlocked! ✅');
                                            set(`${toCoordinate(rpCol)+data[2]}`, parseInt(nationRP.replace(/[,]/g, '')) - data[0])
                                            report(message, `${cfg.users[message.author.id].nation} has unlocked ${tt[node][0]} for ${data[0]}RP`);
                                        } else {
                                            message.channel.send('Node removed!');
                                            report(message, `${cfg.users[message.author.id].nation} has removed ${tt[node][0]} from ${nation}`);

                                        }

                                        //Tech increments change
                                        findHorizontal('Technology', 4)
                                        .then(increments => {
                                            getArray(`${increments}5`, `${(increments+5)+(data[1]-2)}`)
                                            .then(incrementArray => {
                                                //console.log(incrementArray);
                                                if (del === 1) {
                                                    set(`${toCoordinate(increments + tt[node][4])+data[2]}`, (parseFloat(incrementArray[data[2]-5][tt[node][4]]) + 0.1));
                                                } else {
                                                    set(`${toCoordinate(increments + tt[node][4])+data[2]}`, (parseFloat(incrementArray[data[2]-5][tt[node][4]]) - 0.1));
                                                }
                                            }).catch(err => console.error(err));
                                        }).catch(err => console.error(err));
                                        return true;
                                    }
                                    message.channel.send('Operation failed!');
                                    return false;
                                })
                                .catch(err => console.error(err));
                        })
                        .catch(err => console.error(err));
                })
                .catch(err => message.channel.send(err));
        })
        .catch(err => console.error(err));
}
function change(data) {
    const js = require('../jsonManagement');
    const tt = require('./../tt.json');

    if (tt[data[1]] === undefined) {
        return [false];
    }
    let newData = '';
    data.forEach(r => {
        if(r !== data[0] && r !== data[1] && r !== data[2]) {
            newData += r + ' ';
        }
    })
    switch(data[2]) {
        case 'name':
            tt[data[1]][0] = newData.trim();
            break;
        case 'category':
            tt[data[1]][2] = data[3];
            break;
        case 'reqadd':
            tt[data[1]][3].push(data[3]);
            break;
        case 'reqdel':
            for(let i = 0; i < tt[data[1]][3].length; i++) {
                if (tt[data[1]][3][i] === data[3]) {
                    tt[data[1]][3].splice(i, 1);
                }
            }
            break;
    }
    js.exportFile("tt.json", tt);
    return [true, newData];
}
