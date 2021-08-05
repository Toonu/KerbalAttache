const {perm, messageHandler} = require("../utils"), cfg = require('../config.json'), units = require('../units.json');
module.exports = {
    name: 'battle',
    description: 'Command for announcing battle results while removing losses!',
    args: 8,
    usage: `${cfg.prefix}battle [USERS] [OPTIONS] 
    OPTIONS followed by new value:
    \`\`\`
    -a [AMOUNT] [ASSETS]
    -b [AMOUNT] [ASSETS]
    -r [WINNER] letter of winning side [team a/b].
    \`\`\`
    
    The first part of command are the head of states participating in the battle.
    The second part specifies lost assets of nations in same order like the pinged users. The option a or b determines side.
    The optional third part -r option specifies which team has won.
    
    Eg. @user @user2 @user3 -a 2 AFV 1 APC 20 ATGM -b 3 MBT -b 4 L 8 AGM 2 ARM -w a
    **Assets:** can be listed via **${cfg.prefix}buy** command.`,
    cooldown: 5,
    guildOnly: true,

    /**
     * Battle command prints results of a battle and removes all destroyed assets.
     */
    execute: async function battle(message, args) {
        if (perm(message, 2)) {

            //Making user map with array for each user.
            let userMap = [];
            message.mentions.users.forEach(user => {
                if (!cfg.users[user.id]) {
                    return messageHandler(message, new Error('User not found! Canceling operation.'));
                }
                userMap.push([user.id, cfg.users[user.id]]);
            });

            let optionABTest = new RegExp(/-[a|b]+/g);
            let results = false;
            let winningTeam;

            let userNumber = -1;
            let assetNumber = 2;
            for (const arg of args) {
                let amount = parseInt(arg);

                //Skipping the user pings in command's first phase.
                if (!arg.startsWith('<@')) {
                    //Option -a or -b iterates to the next user.
                    if (optionABTest.test(arg)) {
                        userNumber++;

                        // Canceling the command in case of adding more options than users.
                        if (!userMap[userNumber]) {
                            return messageHandler(message,
                                new Error('InvalidArgumentException: More options than used users.'), true);
                        }
                        userMap[userNumber].push(arg);
                    } else if (!arg.startsWith('-') {
                        if (!Number.isNaN(amount)) {
                            //Adding amount of assets.
                            assetNumber++;
                            userMap[userNumber][assetNumber] = [amount];
                        } else {
                            //Adding assets.
                            if (results && ['a', 'b'].includes(arg) && !units.units[arg]) {
                                winningTeam = arg;
                                results = false;
                            }
                            userMap[userNumber][assetNumber].push(arg);
                        }
                    } else if (arg.startsWith('-r')) {
                        //If results option is used.
                        results = true;
                    }
                }
            }
            throw new Error(units);

            

/**
***Until these problems are resolved. Do NOT finish the turn as it will give players with negative amount of units money as if they were selling them!***
Easiest fix is to put all these negative values in sheet to 0 value and assess the situation how player could have more units on map than in sheet!
For better reference, negative numbers are highlighted with red in the sheet.`**/


        }
    }
};