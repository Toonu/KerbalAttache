module.exports = {
    name: 'useredit',
    description: 'Method for editing users!',
    args: false,
    usage: '<user> <data/del> <type>\nTypes: 0 - nation, 1 - color, 2 - pwd',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const fs = require('fs');
        if (fn.perm(message, 2)) {
            const id = message.mentions.users.map(user => {
                return user.id;		
            });
    
            if (args[2] == undefined) {
                message.channel.send("Modification failed. You have to include type of property. See ?help useredit for more info.")
            }
    
            var res;
    
            if (fn.createUser(message)) {
                message.channel.send("New User created.");
            } else if (args[1] == "del") {
                res = fn.modifyUser(message, id, args[2], "undefined");
            } else {
                res = fn.modifyUser(message, id, args[2], args[1]);
            }
    
            if (!res) {
                message.channel.send("Modification failed.")
            } else {
                switch(args[2]) {
                    case "del":
                        message.channel.send("User property deleted.");
                    default:
                        message.channel.send("User property modified.");
                }
            }
        }        
    }
};



/*
        if (message.member.roles.cache.has('768474211333177444')) {
            fs = require('fs');
            const ss = require("./../sheetFunc");
            const cfg = require("./../config.json")
            
            const id = message.mentions.users.map(user => {
                return user.id;		
            });
            try {
                let newUser = id.toString();

                if (cfg.users[newUser] != null && cfg.users[newUser] == args[1].toString()) {
                    message.reply("User with the same references exists. Canceling operation.");
                } else if (args[1].toLowerCase() === "del") {
                    delete cfg.users[newUser];
                    message.channel.send(`Deleted <@${id}> nation reference.`);
                } else {
                    
                    cfg.users[newUser] = args[1].toString();
                    
                    //messaging
                    if (cfg.users[newUser] != args[1].toString()) {
                        message.channel.send(`Edited ${cfg.users[newUser]}`);
                    } else {
                        message.channel.send(`Added  ${cfg.users[newUser]}`);
                    }                   
                }
            } catch(error) {
                message.channel.send(error.message);
            }
            
            var res = fs.writeFileSync("config.json", JSON.stringify(cfg, null, 4));
            return;
        } else {
            message.reply("You do not have permissions to do that. The Directorate for Distribution of permissions apologies.")
    }
    */

/*try {
                fn.createUser(message, args[1]);
                let newUser = id.toString();

                if (cfg.users[newUser].nation != null && cfg.users[newUser].nation == args[1].toString()) {
                    message.reply("User with the same references exists. Canceling operation.");
                } else if (args[1].toLowerCase() === "del") {
                    cfg.users[newUser].nation = undefined;
                    message.channel.send(`Deleted <@${id}> nation reference.`);
                } else {
                    
                    cfg.users[newUser].nation = args[1].toString();
                    
                    //messaging
                    if (cfg.users[newUser].nation != args[1].toString()) {
                        message.channel.send(`Edited ${cfg.users[newUser].nation}`);
                    } else {
                        message.channel.send(`Added ${cfg.users[newUser].nation}`);
                    }                   
                }
            } catch(error) {
                message.channel.send(error.message);
            }*/