module.exports = {
    name: 'config',
    description: 'Method for configuring the bot!',
    args: true,
    usage: '<configuration> <newValue>',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const cfg = require("./../config.json")
        const js = require('./../json');
        const fs = require('fs');
        if (js.perm(message, 2)) {
            const id = message.mentions.users.map(user => {
                return user.id;		
            });
    
            if (args[2] == undefined) {
                message.channel.send("Modification failed. You have to include type of property. See ?help useredit for more info.")
            }
    
            if (js.createUser(message)) {
                message.channel.send("New User created.");
            } else if (args[1] == "del") {
                message.channel.send("User property deleted.");
                var res = js.modifyUser(message, id, args[2], "undefined");
            } else {
                message.channel.send("User property modified.");
                var res = js.modifyUser(message, id, args[2], args[1]);
            }
            if (!res) {
                message.channel.send("Modification failed. Ignore previous message.")
            }
        }        
    }
};