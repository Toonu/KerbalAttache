const cfg = require('./../config.json'), js = require('../jsonManagement'),
    {setArray, getArray} = require("../sheet"), {findVertical, findHorizontal, report} = require("../game");
const {set} = require("../sheet");
module.exports = {
    name: 'turn',
    description: 'Command to finish turn and calculate the chart data!',
    args: false,
    usage: '<true> if revert',
    cooldown: 5,
    guildOnly: true,
    execute: async function turn(message) {
        if(!js.perm(message, 2, true)) return;

        let newResearch = [];
        let coefficient = [];

        let techCol = await findHorizontal('RP', 4).catch(e => {console.log(e)});
        let dataRow = await findVertical('Data', 'A').catch(e => {console.log(e)});
        let balanceArray = await getArray(`A5`, `C${dataRow - 1}`).catch(e => {console.log(e)});
        let researchArray = await getArray(`${techCol}5`, `${techCol + (dataRow - 1)}`, 2, 0).catch(e => {console.log(e)});

        balanceArray.forEach(r => {
            r[1] = parseInt(r[1].replace(/[,|$]/g, ''));
            r[2] = parseInt(r[2].replace(/[,|$]/g, ''));
            r[1] += r[2];
            r.splice(2, 1);
        })

        for (const [key, value] of Object.entries(cfg.users)) {
            coefficient.push([value.nation, value.cf, key]);
        }

        let i = 0;
        researchArray.forEach(r => {
            r[0] = parseFloat(r[0].replace(/[,]/g, ''));
            r[1] = parseInt(r[1].replace(/[,|$]/g, ''));
            r[2] = parseInt(r[2].replace(/[,|$]/g, ''));
            r.push(balanceArray[i][0]);
            r.push(false);
            i++;

            let nation;
            for(nation of coefficient) {
                if(nation[0] === r[3]) {
                    newResearch.push([r[0] + ((nation[1] * r[1])/20000), r[1], r[1]])
                    r[4] = true;
                    if (r[1] === r[2] && cfg.users[nation[2]].cf <= 2) {
                        cfg.users[nation[2]].cf += 0.1;
                    } else {
                        cfg.users[nation[2]].cf = 1;
                    }
                }
            }
        })

        cfg.turn += 1;
        js.exportFile('config.json', cfg);
        let today = new Date();
        let dateTime = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();


        balanceArray.forEach(r => {
            r.splice(0, 1);
        })

        await setArray('B5', balanceArray);
        await setArray(techCol + 5, newResearch);
        await set(`B${dataRow + 1}`, cfg.turn);
        await set(`B${dataRow + 2}`, dateTime);
        report(message, `Turn has been finished by <@${message.author.id}>`, this.name);
    }
};