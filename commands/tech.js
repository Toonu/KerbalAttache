module.exports = {
    name: 'tech',
    description: 'Command for managing your research!',
    args: true,
    usage: "<operation> <operation type> <operation data> <M:@user>\n\nPossible operations:\n**budget <set | add> <M:@user>** - sets or adds money to the research budget (use neg. number to decrease).\n**research <node | -node>** - researches specified tech tree node. Use '-' inf front of node to revert research.\n**list <area>** - lists tech tree nodes of specified area.\n**unlocks <node | all>** - show information about specific node and its unlocks or everything you have unlocked.\n**change <node> <type> <data>** - researches specified tech tree node.\nList of ***areas*** can be obtained via ***?tech list*** command!!!",
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const cfg = require('./../config.json');
        const fn = require('./../fn');
        const gm = require('./../game');
        const js = require('./../json');

        let nation = cfg.users[message.author.id].nation;

        if (message.mentions.users.first() != undefined && js.perm(message, 2)) {
            nation = cfg.users[message.mentions.users.first().id].nation;
        }

        switch(args[0]) {
            case 'budget':
                if(args[1] == 'set') {
                    budget(args[2], nation, message, false);
                } else if (args[1] == 'add') {
                    budget(args[2], nation, message, true);
                } else {
                    message.channel.send('Operation type provided does not exist!');
                }
                break;
            case 'research':
                if(parseInt(args[1].substring(0,2)) >= cfg.era) {
                    message.channel.send('The technology is too futuristic!');
                    return;
                }
                research(args[1].toLowerCase(), nation, message);
                break;
            case 'list':
                list(args[1], message);
                break;
            case 'change':
                let ch = change(args)
                if (ch[0]) {
                    gm.report(message, `${message.author.username} has changed the ${args[1]} ${args[2]} to ${ch[1]}!`)
                } else {
                    message.channel.send('Operation failed.');
                }
                break;
            case 'unlocks':
                unlocks(args[1].toLowerCase(), nation, message);
                break;
        }
    },   
};
function budget(amount, nation, message, add) {
    const fn = require('./../fn');
    const gm = require('./../game');
    const cfg = require('./../config.json');

    try {
        amount = parseInt(amount);
        if (isNaN(amount)) throw 'Argument is not a number. Canceling operation.'

        add = add ? 1 : 0;
        gm.findUnitPrice('ResBudget', message, nation)
            .then(data => {
                if (data[0] == false) {
                    data[0] = 0;
                } else {
                    data[0] = parseInt(data[0].replace(/[,|$]/g, ''));
                }
                
                let budget = data[0]*add + amount;
                if (budget < 0) throw 'Budget cannot be set lower than 0!';

                fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, budget], message)
                    .then(result => {
                        if (result && add) {
                            message.channel.send(`Research budget modified to ${budget+cfg.money}!`);
                        } else if (result) {
                            message.channel.send(`Research budget set to ${budget+cfg.money}!`);
                        } else {
                            message.channel.send('Operation failed!');
                        }
                    })
                    .catch(err => {throw err});  
            })
            .catch(err => message.channel.send(err));  
    } catch(err) {
        message.channel.send(err);
    }
}
function list(category, message) {
    const cfg = require('./../config.json');
    const fn = require('./../fn');
    const gm = require('./../game');
    const js = require('./../json');
    const tt = require('./../tt.json');

    let newMessage = '';

    //Lists the main categories, then returns and you have to repeat the command.
    if(category == undefined) {
        Object.keys(tt.categories).forEach(item => {
            newMessage += `${item}\n`;
        })
        
        message.channel.send("All technology node categories are bellow: \n" + newMessage + '\n\n***Note:*** You do not have to write full category name but merely it part is sufficient.')
        .then(msg => msg.delete({ timeout: 30000 }))
        .catch(err => console.log(msg));
        return;
    }

    //Makes the node list to print.
    let nodes = [];
    for (const [key, value] of Object.entries(tt)) {
        try {
            if(value[2].toLowerCase().includes(category.toLowerCase())) {
                nodes.push(key);
            }
        } catch(err) {}
    }
    
    //If category is not exact, assign user input as category name.
    let ctg = tt.categories[category];
    if (ctg == undefined) {
        ctg = category;
    }

    //Edits the node list to print with padding.
    let l = 0;
    nodes.forEach(item => {
        if (item.length > l) {
            l = item.length;
        }
    });

    //Constructs the message.
    nodes.forEach(item => {
        newMessage += `[${item.padStart(l)}] ${tt[item][0]}\n`;
    });
    message.channel.send(`***Nodes in specified category ${ctg}:***\n\n\`\`\`ini\n${newMessage}\`\`\``)
    .catch(err => message.channel.send('Message over 2000 letters long. Cannot send. Please choose smaller category.'));
}
async function research(node, nation, message) {
    const cfg = require('./../config.json');
    const fn = require('./../fn');
    const gm = require('./../game');
    const js = require('./../json');
    const tt = require('./../tt.json');
    let rpCol;
    let nationRP;
    let data;
    let del = 1;
    if (node.startsWith('-') && js.perm(message, 2)) {
        del = 0;
        node = node.substring(1, node.length);
    }

    //Checking prerequisites
    try {
        for await (const r of tt[node][3]) {
        await gm.findUnitPrice(r, message, nation, 'TechTree', true)
            .then(unlocked => {
                //console.log(r);
                if(unlocked[3] == '0') throw 'You do not have the prerequisites to unlock the node!';
            })
        } 
    } catch(err) {
        message.channel.send(err);
        return;
    }
    
    //Checking node
    gm.findUnitPrice(node, message, nation, 'TechTree', true) 
        .then(data => {
            if (del && parseInt(data[3]) == 1) {
                message.channel.send('Node already unlocked!');
                return false;
            }
            //Checking rp amount
            gm.findHorizontal('RP', 4, message)
                .then(rpCol => {
                    fn.ss(['get', `${fn.toCoord(rpCol)+data[2]}`], message)
                        .then(rp => {
                            nationRP = rp
                            if (data[0] > rp && del != 0) {
                                message.channel.send('Not enough Research Points!');
                                return false;
                            }
                            //Setting node and then RP
                            fn.ss(['set', `${fn.toCoord(data[1])+data[2]}`, del], message, 'TechTree')
                                .then(result => {
                                    if (result) {
                                        if (del == 1) {
                                            message.channel.send('Node unlocked! ✅');
                                            fn.ss(['set', `${fn.toCoord(rpCol)+data[2]}`, parseInt(nationRP.replace(/[,]/g, '')) - data[0]], message)
                                            gm.report(message, `${cfg.users[message.author.id].nation} has unlocked ${tt[node][0]} for ${data[0]}RP`);
                                        } else {
                                            message.channel.send('Node removed!');
                                            gm.report(message, `${cfg.users[message.author.id].nation} has removed ${tt[node][0]} from ${nation}`);

                                        }

                                        //Tech increments change
                                        gm.findHorizontal('Technology', 4, message)
                                        .then(increments => {
                                            fn.ss(['getA', `${fn.toCoord(increments)}5`, `${fn.toCoord(increments+5)+(data[1]-2)}`], message)
                                            .then(incrementArray => {
                                                //console.log(incrementArray);
                                                if (del == 1) {
                                                    fn.ss(['set', `${fn.toCoord(increments + tt[node][4])+data[2]}`, (parseFloat(incrementArray[data[2]-5][tt[node][4]]) + 0.1)], message);
                                                } else {
                                                    fn.ss(['set', `${fn.toCoord(increments + tt[node][4])+data[2]}`, (parseFloat(incrementArray[data[2]-5][tt[node][4]]) - 0.1)], message);
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
    const js = require('./../json');
    const tt = require('./../tt.json');

    if (tt[data[1]] == undefined) {
        return [false];
    }
    let newData = '';
    data.forEach(r => {
        if(r != data[0] && r != data[1] && r != data[2]) {
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
            for(var i = 0; i < tt[data[1]][3].length; i++) {
                if (tt[data[1]][3][i] == data[3]) {
                    tt[data[1]][3].splice(i, 1);
                }
            }
            break;
    }
    js.exportFile("tt.json", tt);
    return [true, newData];
}
function unlocks(node, nation, message) {
    const fn = require('./../fn');
    const gm = require('./../game');
    const Discord = require('discord.js');
    const tt = require('./../tt.json');

    if(node != 'all') {
        gm.findHorizontal(node, 4, message, 'TechTree')
            .then(col => {
                //console.log('nodePos ' + col);
                gm.findVertical('Data', 'A', message, 'TechTree')
                    .then(row => {
                        //console.log(row);
                        fn.ss(['getA', `${fn.toCoord(col)+row}`, `${fn.toCoord(col)+row}`, 0, 1], message, 'TechTree')
                            .then(rp => {
                                const embed = new Discord.MessageEmbed()
                                .setColor('#e6e600')
                                .setTitle(`Node ${tt[node][0]}`)
                                .setURL('https://discord.js.org/') //URL clickable from the title
                                .setThumbnail('https://imgur.com/IvUHO31.png')
                                .addFields(
                                    { name: 'Unlocks:', value: rp[1]},
                                    { name: 'Cost:', value: `${rp[0]}RP`, inline: true},
                                    { name: 'Buy?', value: `✅`, inline: true},
                                )
                                .setFooter('Made by the Attaché to the United Nations.\nThis message will be auto-destructed in 60 seconds if not reacted upon!', 'https://imgur.com/KLLkY2J.png');

                                const filter = (reaction, user) => {
                                    return (reaction.emoji.name === '✅' && user.id === message.author.id);
                                };

                                message.channel.send(embed)
                                .then(msg => {
                                    msg.react("✅");
                                    msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
                                    .then(collected => {
                                        react = collected.first();
                                        if (react.emoji.name == '✅') {
                                            research(node, nation, message);
                                            msg.delete();
                                            message.delete();
                                        }
                                    })
                                    .catch(r => {
                                        msg.delete();
                                        message.delete();
                                    })
                                }).catch(err => console.error(err));
                            }).catch(err => console.error(err));
                    }).catch(err => console.error(err));
            }).catch(err => console.error(err))
    } else {
        let nodes;
        let names;
        let data;
        var unlocks = [];

        gm.findVertical(nation, 'A', message)
        .then(nationRow => {
            fn.ss(['getA', `A${nationRow}`, `HO${nationRow}`], message, 'TechTree')
            .then(nodes => {
                gm.findVertical('Data', 'A', message, 'TechTree')
                .then(dataRow => {
                    fn.ss(['getA', `A${dataRow}`, `HO${dataRow}`, 1, 2], message, 'TechTree')
                    .then(data => {
                        fn.ss(['getA', 'A4', 'HO4'], message, 'TechTree')
                        .then(names => {
                            for(var i = 1; i < nodes[0].length; i++) {
                                if (nodes[0][i] == '1') {
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

                            message.channel.send(`Unlocked nodes and their parts:\n\`\`\`ini\n${newMessage}\`\`\``);
                        })
                    })
                })
            })
        })
    }
}
