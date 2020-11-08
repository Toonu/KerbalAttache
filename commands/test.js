const {findUnitPrice} = require("../game");
module.exports = {
    name: 'test',
    description: 'Command for testing latest projects!',
    args: false,
    usage: '[args]',
    cooldown: 5,
    guildOnly: true,
    execute: async function test(message) {
        let x = await findUnitPrice('Tiles', message, 'Iconia');
        console.log(x);
        message.delete();

        //message.reply('There is nothing to see. Move along.');
    }    
};