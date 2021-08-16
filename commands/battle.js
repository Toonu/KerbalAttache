// noinspection ExceptionCaughtLocallyJS

const {perm, messageHandler, log, report} = require("../utils"), cfg = require('../config.json'),
    assets = require('../dataImports/assets.json'), {findAsset} = require('../sheet');
module.exports = {
    name: 'battle',
    description: 'Command for announcing battle results while removing losses!',
    args: 8,
    usage: `${cfg.prefix}battle [USERS] [OPTIONS] 
    OPTIONS followed by new value:
    \`\`\`
    -a [AMOUNT] [ASSETS]
    -b [AMOUNT] [ASSETS]
    -r [WINNER] letter of winning side [team a/b/d  -d is draw].
    -n [BATTLE NAME]
    \`\`\`
    
    The first part of command are the head of states participating in the battle.
    The second part specifies lost assets of nations in same order like the pinged users. The option a or b determines side.
    The optional third part -r option specifies which team has won.
    Optional battle name MUST be the last argument of the command!
    
    Eg. @user @user2 @user3 -a 2 AFV 1 APC 20 ATGM -b 3 MBT -b 4 L 8 AGM 2 ARM -w a -n Battle of five armies
    **Assets:** can be listed via **${cfg.prefix}buy** command.`,
    cooldown: 5,
    guildOnly: true,

    /**
     * Battle command prints results of a battle and removes all destroyed assets.
     */
    execute: async function battle(message, args, db) {
        // noinspection JSUnresolvedFunction
        if (perm(message, 2)) {

            //Making user map with array for each user.
            let userMap = [];
            message.mentions.users.forEach(user => {
                let test = db.getUser(user);
                if (!test || !test.state) {
                    return messageHandler(message,
                        new Error(`NullReferenceException: User or state ${user} not found! Canceling operation.`));
                }
                userMap.push([test]);
            });

            let optionABTest = new RegExp(/-[a|b]+/g);
            let winning = false;
            let winningTeam;
            let name;

            //Parsing input arguments into an user map with their sides and assets.
            let userNumber = -1;
            let assetNumber = 1;
            for (let arg of args) {
                let amount = parseInt(arg);

                //Skipping the user pings in command's first phase.
                if (!arg.startsWith('<@')) {
                    //Option -a or -b iterates to the next user.
                    if (optionABTest.test(arg)) {
                        userNumber++;
                        assetNumber = 1;

                        // Canceling the command in case of adding more options than users.
                        if (!userMap[userNumber]) {
                            return messageHandler(message,
                                new Error('InvalidArgumentException: More options than used users.'), true);
                        }
                        userMap[userNumber].push(arg);
                    } else if (!arg.startsWith('-')) {
                        if (Number.isNaN(amount)) {
                            if (winning && ['a', 'b', 'd'].includes(arg) && !assets.assets[arg]) {
                                //Adding winning team.
                                winningTeam = arg;
                                winning = false;
                            } else if (name) {
                                //Adding battle name.
                                name += `${arg} `;
                            } else {
                                try {
                                    let asset = findAsset(arg);
                                    userMap[userNumber][assetNumber].push(asset);
                                } catch (error) {
                                    return messageHandler(message, error, true);
                                }
                            }
                        } else {
                            //Adding number of lost assets.
                            assetNumber++;
                            userMap[userNumber][assetNumber] = [amount];
                        }
                    } else if (arg.startsWith('-r')) {
                        //If results option is used.
                        winning = true;
                    } else if (arg.startsWith('-n')) {
                        //If name option is used.
                        name = 'Name: '
                    }
                }
            }
            
            let negatives = [];
            // noinspection JSMismatchedCollectionQueryUpdate
            let results = [];

            try {
                //Loop through sides.
                for (const user of userMap) {
                    //Loop through assets of one side.
                    if (user.length > 2) {
                        results.push(`${user[0].state.name} lost ${user.length - 2} assets\n`);
                    }
                    for (let asset = 2; asset < user.length; asset++) {
                        let assetItem = user[asset][1];
                        
                        //Updating data and reporting.
                        try {
                            user[0].state.assets.modify(assetItem, -user[asset][0], user.state, true);
                        } catch (error) {
                            negatives.push(`\n${user[0].user.username} | ${user[0].state.name} has gone into ${error.message.substring(45)} ${assetItem.name}`);
                        }
                        results.push(` - ${Math.abs(user[asset][0]).toString().padStart(2)} ${assetItem.name}\n`);
                    }
                }
            } catch (error) {
                return messageHandler(message, error, true);
            }
            
            //Logging
            // noinspection JSUnresolvedVariable, JSUnresolvedFunction
            message.client.channels.cache.get(cfg.servers[message.guild.id].battleid)
            .send(`[Battle results]:\n${name}\n\nLosses:\n\`\`\`\n${results}\n\`\`\`
${winningTeam === 'd' ? 'The battle has been a draw!' : `Team ${winningTeam.toUpperCase()} has been victorious.`}
            `).catch(error => log(error));
            
            db.export();

            report(message, `Battle was announced in battle channel by ${message.author.username}. ${(negatives.length === 0 ? '' : `\n\nProblem with negative amounts of assets has been found! Until these problems are resolved. Do NOT finish the turn as it will give players with negative amount of units money as if they were selling them!
Easiest fix is to put all these negative values in sheet to 0 value and assess the situation how player could have more units on map than in sheet!
For better reference, negative numbers are highlighted with red in the sheet.`)}${(negatives.length === 0 ? '' : `\n\n\`\`\`${negatives}\`\`\``)}`, this.name);
            message.delete().catch(error => log(error, true));
        }
    }
};