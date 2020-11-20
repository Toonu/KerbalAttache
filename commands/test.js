module.exports = {
    name: 'test',
    description: 'Command for testing latest projects!',
    args: false,
    usage: '[args]',
    cooldown: 5,
    guildOnly: true,
    execute: async function test(message, args) {
        message.reply('There is nothing to see. Move along.').then(msg => msg.delete({timeout: 9000}));
        message.delete({timeout: 9000});
    }    
};