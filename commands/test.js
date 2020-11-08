const sh = require("../sheet");
module.exports = {
    name: 'test',
    description: 'Command for testing latest projects!',
    args: false,
    usage: '[args]',
    cooldown: 5,
    guildOnly: true,
    execute: async function test(message, args) {
        let data = await sh.getArray(args[0], args[1], args[2], args[3])
        if (data === undefined) {
            message.channel.send('Empty cell');
        } else {
            message.channel.send(data);
        }
        message.delete();


        //message.reply('There is nothing to see. Move along.');
    }    
};