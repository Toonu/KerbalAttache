const {ping, perm} = require("../jsonManagement"), cfg = require('../config.json');
module.exports = {
    name: 'battle',
    description: 'Command for removing units after battle!',
    args: false,
    usage: '[sides] -u [units lost separated between sides by -s]\nEg. @user @user2 @user3 -u 2 AFV 1 APC 20 ATGM -s 3 MBT -s 4 L 8 AGM 2 ARM',
    cooldown: 5,
    guildOnly: true,
    execute: async function test(message, args) {
        message.reply('There is nothing to see. Move along.');

        return;

        let userMap;
        let units = [];
        if (perm(message, 2, true)) {
            userMap = message.mentions.users;
            let counter = 0;
            let regExp = new RegExp(/[0-9]/);
            for (let i = 0; i < args.length; i++) {
                if (['-s', '-d'].includes(args[i])) {
                    units.push(userMap[counter]);
                    counter++;
                } else if (!args[i].startsWith('<@') || !regExp.test(args[i])) {
                    units[counter].push([args[i], args[i + 1]]);
                }
            }
        }
    }
};