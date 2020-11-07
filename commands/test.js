module.exports = {
    name: 'test',
    description: 'Command for testing latest projects!',
    args: false,
    usage: '<args>',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require('./../config.json')
        const js = require('./../json');
        const fn = require('./../fn')
        const gm = require('./../game');
        const Discord = require('discord.js');

        message.reply('There is nothing to see. Move along.');
    }    
};