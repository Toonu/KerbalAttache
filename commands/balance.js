module.exports = {
    name: 'balance',
    description: 'Method for getting your current money balance (amount of money on account)!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");

        array = await fn.ss(["getA", "A5", "C15"], message, false, "Maintenance");
        message.channel.send(array);
        console.log(array);
        array.forEach(element => {
            if (args[0] != undefined && fn.perm(message, 2)) {
                //message.channel.send(element);
                if (element[0].startsWith(cfg.users[message.mentions.users.first().id].nation)) {
                    message.channel.send(`Balance of <@${message.mentions.users.first().id}> is: ${element[1]}`);
                    return;
                }
            } else if (element[0].startsWith(cfg.users[message.author.id].nation)) {
                message.channel.send(`Account: ${element[1]}\nBalance ${element[2]}`);
                return;
            }
        });
        
        //.catch(message.channel.send("Operation failed.")); 
        
        result = await gm.findUnitPrice("AFV", message).catch(message.channel.send("Error in main."));
        message.channel.send(result);
        return;
        //.catch(message.channel.send("Operation failed.X")); 
    },
};