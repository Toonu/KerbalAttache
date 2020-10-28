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

        var array = await fn.ss(["getA", "A5", "C15"], message, false, "Maintenance");
        console.log(array);
        array.forEach(element => {
            if (args[0] != undefined && fn.perm(message, 2) && element[0].startsWith(cfg.users[message.mentions.users.first().id].nation)) {
                message.channel.send(`Balance of <@${message.mentions.users.first().id}> is: ${element[1]}`);
            } else if (element[0].startsWith(cfg.users[message.author.id].nation)) {
                message.channel.send(`Nation: ${element[0].split(" ")[0]}\nAccount: ${element[1]}\nBalance: ${element[2]}`);
            }
        });
    },
};