module.exports = {
    name: 'tech',
    description: 'Command for managing your research!',
    args: true,
    usage: '<operation> <operation type> <operation data> <M:@user>\nPossible operations:\n**budget <set | add>** - sets or adds money to the research budget (use negative number to decrease).\n**research <node>** - researches specified tech tree node.\n**list <area>** - lists tech tree nodes of specified area.\n***List of areas can be obtained via ?tech list command!!!***',
    cooldown: 5,
    guildOnly: true,
    execute: function execute(message, args) {
        const cfg = require('./../config.json');
        const fn = require('./../fn');
        const gm = require('./../game');
        const js = require('./../json');
        
        let nation = cfg.users[message.author.id].nation;
        if (args[3] != undefined && js.perm(message, 2)) {
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
                    return;
                }
            case 'research':
                research(args[1].toLowerCase(), nation, message);
                return;
            case 'list':
                list(args[1], message);
                return;
            case 'change':
                //configruation of nodes for moderators in case something needs to be changed, will work with json tt file.    
                return;
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
    const t = require('./../tt.json');

    let newMessage = '';

    //Lists the main categories, then returns and you have to repeat the command.
    if(category == undefined) {
        Object.keys(t.categories).forEach(item => {
            newMessage += `${item}\n`;
        })
        
        message.channel.send("All technology node categories are bellow: \n" + newMessage + '\n\n***Note:*** You do not have to write full category name but merely it part is sufficient.')
        .then(msg => msg.delete({ timeout: 30000 }))
        .catch(err => console.log(msg));
        return;
    }

    let nodes = [];

    for (const [key, value] of Object.entries(t)) {
        try {
            if(value[2].toLowerCase().includes(category.toLowerCase())) {
                nodes.push(key);
            }
        } catch(err) {}
    }
    
    nodes.forEach(item => {
        newMessage += `${item}: ${t[item][0]}\n`;
    });
    message.channel.send(`***Nodes in specified category ${t.categories[category]}:***\n\n${newMessage}`)
    .catch(err => message.channel.send('Message over 2000 letters long. Cannot send. Please choose smaller category.'));
}
function research(node, nation, message) {
    const cfg = require('./../config.json');
    const fn = require('./../fn');
    const gm = require('./../game');
    const js = require('./../json');
    const t = require('./../tt.json');
    let rpCol;
    let nationRP;
    let data;

    gm.findUnitPrice(node, message, nation, true, 'TechTree') 
        .then(data => {
            if (parseInt(data[3]) == 1) {
                message.channel.send('Node already unlocked!');
                return false;
            }          
            gm.findHorizontal('RP', 4, message)
                .then(rpCol => {
                    fn.ss(['get', `${fn.toCoord(rpCol)+data[2]}`], message)
                        .then(rp => {
                            nationRP = rp
                            if (data[0] > rp) {
                                message.channel.send('Not enough Research Points!');
                                return false;
                            }
                            fn.ss(['set', `${fn.toCoord(data[1])+data[2]}`, 1], message, 'TechTree')
                                .then(result => {
                                    if (result) {
                                        message.channel.send('Node unlocked!');
                                        fn.ss(['set', `${fn.toCoord(rpCol)+data[2]}`, parseInt(nationRP.replace(/[,]/g, '')) - data[0]], message)
                                        gm.report(message, `${cfg.users[message.author.id].nation} has unlocked ${t[node][0]} for ${data[0]}RP`);
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