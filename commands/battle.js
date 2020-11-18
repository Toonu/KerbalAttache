const {perm} = require("../jsonManagement"), cfg = require('../config.json'), units = require('../units.json'),
{findHorizontal, findVertical, report} = require("../game"), {getArray, setArray} = require("../sheet");
module.exports = {
    name: 'battle',
    description: 'Command for removing units after battle!',
    args: false,
    usage: `[@users] -u [number unit] 
Eg. @user @user2 @user3 -u 2 AFV 1 APC 20 ATGM -s 3 MBT -s 4 L 8 AGM 2 ARM
**Assets:** can be listed via **?buy** command.`,
    cooldown: 5,
    guildOnly: true,

    /**
     * Battle command prints results of a battle and removes all destroyed assets.
     */
    execute: async function battle(message, args) {
        if (perm(message, 2, true)) {
            let userMap = Array.from(message.mentions.users);
            let counter = -1;
            let regExp = new RegExp(/[0-9]/);
            let negative = [];

            for (let i = 0; i < args.length; i++) {
                if (!args[i].startsWith('<@') || !regExp.test(args[i])) {
                    if (args[i].startsWith('-')) {
                        counter++;
                        userMap[counter].push([]);
                    } else if (!regExp.test(args[i])) {
                        let num = parseInt(args[i - 1]);
                        if (isNaN(num)) return message.reply(`Number ${args[i - 1]} is not a number!`);
                        userMap[counter][2].push([args[i].toUpperCase(), num]);
                    }
                }
            }
            for (let k = 0; k < userMap.length; k++) {
                let user = userMap[k];
                if (cfg.users[user[0]].nation === ' ') {
                    return message.reply(`Non-existent nation linked to the <@${user[0]}> user!`);
                } else {
                    userMap[k].push(cfg.users[user[0]].nation);
                }
                for (let unit of user[2]) {
                    if (units[unit[0]] === undefined) {
                        return message.reply(`Non-existent unit type of ${unit[0]}!`);
                    }
                }
            }

            let end = await findHorizontal('Technology', 4);
            let rows = await findVertical('Data', 'A');
            let data = await getArray('A4', `${end + (parseInt(rows) + 1)}`).catch(e => console.error(e));
            let userMapWp = JSON.parse(JSON.stringify(userMap));

            for (let k = 0; k < userMap.length; k++) {
                let user = userMap[k];
                for (let item of data) {
                    if (item[0] === user[3]) {
                        for (let i = 0; i < user[2].length; i++) {
                            for (let j = 3; j < item.length; j++) {
                                if (user[2][i][0] === data[0][j]) {
                                    if (item[j] !== '.') {
                                        item[j] = parseInt(item[j]) - user[2][i][1];
                                        if (parseInt(item[j]) - user[2][i][1] < 0) {
                                            negative.push(`Nation ${user[3]} got into negative numbers with ${user[2][i][0]}s after this battle!`);
                                        }
                                    } else {
                                        item[j] = 0 - user[2][i][1];
                                        negative.push(`Nation ${user[3]} got into negative numbers with ${user[2][i][0]}s after this battle!`);
                                    }
                                    for (let k = 0; k < userMapWp[k][2].length; k++) {
                                        if (userMapWp[k][2][k][0] === user[2][i][0]) {
                                            userMapWp[k][2].splice(k, 1);
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        break;
                    }
                }
            }

            for (let i = 0; i < data.length; i++) {
                data[i].splice(0, 4);
            }

            end = await findHorizontal('END', 4, 'Stockpiles');
            rows = await findVertical('Data', 'A', 'Stockpiles');
            let dataWp = await getArray('A4', `${end + (parseInt(rows) + 1)}`, 0, 0, 'Stockpiles').catch(e => console.error(e));

            for (let user of userMapWp) {
                for (let item of dataWp) {
                    if (item[0] === user[3]) {
                        for (let i = 0; i < user[2].length; i++) {
                            for (let j = 1; j < item.length; j++) {
                                if (user[2][i][0] === dataWp[0][j]) {
                                    if (item[j] !== '.') {
                                        item[j] = parseInt(item[j]) - user[2][i][1];
                                        if (parseInt(item[j]) - user[2][i][1] < 0) {
                                            negative.push(`Nation ${user[3]} got into negative numbers with ${user[2][i][0]}s after this battle!`);
                                        }
                                        break;
                                    } else {
                                        item[j] = 0 - user[2][i][1];
                                        negative.push(`Nation ${user[3]} got into negative numbers with ${user[2][i][0]}s after this battle!`);
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
            data.splice(0, 1);
            data.splice(-1, 1);
            data.splice(-1, 1);

            for (let i = 0; i < dataWp.length; i++) {
                dataWp[i].splice(0, 1);
            }
            dataWp.splice(0, 1);
            dataWp.splice(-1, 1);

            for (let d of data) {
                for (let i = 0; i < d.length; i++) {
                    if(d[i] === '.') {
                        d[i] = 0;
                    }
                }
            }
            for (let d of dataWp) {
                for (let i = 0; i < d.length; i++) {
                    if(d[i] === '.') {
                        d[i] = 0;
                    }
                }
            }


            await setArray('E5', data);
            await setArray('B5', dataWp, 'Stockpiles');

            let today = new Date();
            let dateTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

            let reportMsg = ''
            userMap.forEach(r => {r[2].forEach(g => {
                    reportMsg += `${r[3]} has lost ${g[1]} of ${g[0]} in this battle!\n`
                })
            });
            let negativeMsg = '';
            negative.forEach(r => {
                negativeMsg += `${r}\n`;
            })

            message.client.channels.cache.get(cfg.servers[message.guild.id].battle_channel).send(`[${dateTime} UTC]   [Battle results]:\n\n\`\`\`ini\n${reportMsg}\`\`\``).then(e => console.log(e));
            report(message, `Battle announced in <#${cfg.servers[message.guild.id].battle_channel}> had this reported problems:\n\`\`\`${negativeMsg}\`\`\``, 'Battle');
        }
    }
};