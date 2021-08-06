// noinspection ExceptionCaughtLocallyJS

const {perm, messageHandler, findArrayData, log, report} = require("../utils"), cfg = require('../config.json'),
    units = require('../units.json'), {getCellArray, setCellArray, toColumn} = require('../sheet');
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
    execute: async function battle(message, args) {
        if (perm(message, 2)) {

            //Making user map with array for each user.
            let userMap = [];
            let isErroneous = false;
            message.mentions.users.forEach(user => {
                if (!cfg.users[user.id]) {
                    return messageHandler(message, new Error('User not found! Canceling operation.'));
                }
                userMap.push([user.id, cfg.users[user.id]]);
            });

            let optionABTest = new RegExp(/-[a|b]+/g);
            let winning = false;
            let winningTeam;
            let name;

            //Parsing input arguments into an user map with their sides and assets.
            let userNumber = -1;
            let assetNumber = 2;
            for (const arg of args) {
                let amount = parseInt(arg);

                //Skipping the user pings in command's first phase.
                if (!arg.startsWith('<@')) {
                    //Option -a or -b iterates to the next user.
                    if (optionABTest.test(arg)) {
                        userNumber++;
                        assetNumber = 2;

                        // Canceling the command in case of adding more options than users.
                        if (!userMap[userNumber]) {
                            return messageHandler(message,
                                new Error('InvalidArgumentException: More options than used users.'), true);
                        }
                        userMap[userNumber].push(arg);
                    } else if (!arg.startsWith('-')) {
                        if (!Number.isNaN(amount)) {
                            //Adding number of lost assets.
                            assetNumber++;
                            userMap[userNumber][assetNumber] = [amount];
                        } else {
                            if (winning && ['a', 'b', 'd'].includes(arg) && !units.units[arg]) {
                                //Adding winning team.
                                winningTeam = arg;
                                winning = false;
                            } else if (name) {
                                //Adding battle name.
                                name += `${arg} `;
                            } else if (units.units[arg]) {
                                //Adding assets.
                                userMap[userNumber][assetNumber].push(units.units[arg]);
                            }
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

            //Gathering data for modification.
            let dataSystems = await getCellArray('A1', cfg.systemsEndCol, cfg.systems, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
            let dataMain = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
            if (isErroneous) return;

            let negatives = [];
            let results = [];
            let isSystemPresent = false;

            try {
                //Loop through sides.
                for (const user of userMap) {
                    let userRow = dataMain[0].indexOf(user[1].nation);
                    let assetColumn;
                    
                    if (userRow === -1) {
                        return messageHandler(message, `${user[1].nation} not found on the sheet!`)
                    }

                    //Loop through assets of one side.
                    for (let asset = 3; asset < user.length; asset++) {
                        let assetItem = user[asset][1];
                        //Branching to systems if assetItem is a system.
                        let sheet = dataMain;
                        let row = cfg.mainRow;
                        if (assetItem.type === 'system') {
                            sheet = dataSystems;
                            row = cfg.systemsMainRow
                            isSystemPresent = true;
                        }
                        //Throws error if not found.
                        assetColumn = findArrayData(sheet, [user[asset][1].name], row)[[asset][1].name];
                        
                        //Getting latest amount data.
                        if (Number.isNaN(sheet[assetColumn][userRow])) {
                            throw new Error(`InvalidTypeException: Value in ${assetItem} column is not a number!`);
                        }
                        
                        //Updating data and reporting.
                        sheet[assetColumn][userRow] -= user[asset][0];
                        if (sheet[assetColumn][userRow] < 0) {
                            negatives.push(`${user[1].name} is missing ${Math.abs(sheet[assetColumn][userRow])} ${assetItem.name}\n`);
                        }
                        results.push(`${user[1].nation} lost ${Math.abs(user[asset][0])} ${assetItem.name}\n`);
                    }
                }
            } catch (error) {
                return messageHandler(message, error, true);
            }
            
            //Applying the modifications to sheets online.
            if (isSystemPresent) {
                //removing the first column.
                dataSystems.splice(0, 1);
                await setCellArray('B1', dataSystems, cfg.systems, true).catch(error => {
                    log(error, true);
                    isErroneous = true;
                    return messageHandler(message, new Error('Error has occurred in systems tab.'), true);
                });
            }
    
            let i = 0
            let start = 0;
            for (i; i < dataMain.length; i++) {
                if (dataMain[i][cfg.mainAccountingRow] === 'Expenses') start = i;
                if (dataMain[i][cfg.mainAccountingRow] === 'Surface') break;
            }
            dataMain.splice(i);
            dataMain.splice(0, start + 1);
            
            
            await setCellArray(toColumn(start + 1) + '1', dataMain, cfg.main, true).catch(error => {
                log(error, true);
                isErroneous = true;
                return messageHandler(message, new Error('Error has occurred in assets tab.'), true);
            });
            if (isErroneous) return;
            
            
            //Logging
            message.client.channels.cache.get(cfg.servers[message.guild.id].battleid)
            .send(`[Battle results]:\n${name}\n\nLosses:\n\`\`\`\n${results}\n\`\`\`
${winningTeam === 'd' ? 'The battle has been a draw!' : `Team ${winningTeam.toUpperCase()} has been victorious.`}
            `).catch(error => log(error));

            report(message, `Battle was announced in battle channel by ${message.author.username}. ${negatives.length !== 0 ? `\n\nProblem with negative amounts of assets has been found! Until these problems are resolved. Do NOT finish the turn as it will give players with negative amount of units money as if they were selling them!
Easiest fix is to put all these negative values in sheet to 0 value and assess the situation how player could have more units on map than in sheet!
For better reference, negative numbers are highlighted with red in the sheet.` : ''}${negatives.length !== 0 ? `\n\n\`\`\`${negatives}\`\`\`` : ''}`, this.name);
            message.delete().catch(error => log(error, true));
        }
    }
};