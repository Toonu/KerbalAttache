module.exports = {
    name: 'useredit',
    description: 'Command for editing users!',
    args: true,
    usage: '<A:@user> <A:data/del> <A:type>\nTypes:\n0: Nation (admin), 1: color (admin), 2: pwd (admin), 3: notes (user)',
    cooldown: 5,
    guildOnly: true,
    execute(message, args) {
        const js = require('./../json');
        if (js.perm(message, 2) || args[2] == '3') {
            const id = message.mentions.users.first();
    
            if (js.createUser(message)) {
                message.channel.send("New User created. Please retry the command to edit his atributes.");
                return;
            } else if (args[2] == undefined) {
                message.channel.send("Modification failed. You have to include type of property. See ?help useredit for more info.");
                return;
            }
    
            if (args[1] == "del" && js.modifyUser(message, id, args[2], "undefined")) {
                message.channel.send("User property deleted.");
            } else if (js.modifyUser(message, id, args[2], args[1])) {
                message.channel.send("User property modified.");
            } else {
                message.channel.send("Modification failed.");
            }
        }        
    }
};