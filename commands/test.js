const fn = require("../fn");
const gm = require("../game");
module.exports = {
    name: 'test',
    description: 'Command for testing latest projects!',
    args: false,
    usage: '<args>',
    cooldown: 5,
    guildOnly: true,
    execute: async function test(message) {

        let x = await gm.findUnitPrice('Tiles', message, 'Iconia');
        console.log(x);

        //message.reply('There is nothing to see. Move along.');
    }    
};