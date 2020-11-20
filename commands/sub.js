module.exports = {
    name: 'sub',
    description: 'Command for getting information about your subscriptions!',
    args: false,
    usage: '[args]',
    cooldown: 5,
    guildOnly: true,
    execute: async function sub(message, args) {
        message.reply('There is nothing to see. Move along.');
    }
};