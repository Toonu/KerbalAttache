const cfg = require('./../config.json'), js = require('../utils'),
    {setCellArray, getCellArray, setCell} = require("../sheet"), {findVertical, findHorizontal, report} = require("../game");
module.exports = {
    name: 'turn',
    description: 'Command for finishing turn and updating the sheet data!',
    args: 0,
    usage: `${cfg.prefix}turn`,
    cooldown: 5,
    guildOnly: true,
    execute: async function turn(message) {
        if(!js.perm(message, 2, true)) return;

        let data = await getCellArray('A1', 'AN', cfg.main, true)
            .catch(error => {
                console.error(error);
                return message.channel.send(error)
                    .then(errorMessage => errorMessage.delete({timeout: 6000}).catch(error => console.error(error)))
                    .catch(error => console.error(error));
        });

        let accountColumn;
        let balanceColumn;
        let researchColumn;
        let researchBudgetColumn;
        let nationColumn = data[0];
        let coefficientColumn;
        let dataStart = 0;
        let dataEnd = 0;
        for (dataEnd; dataEnd < data[0].length; dataEnd++) {
            if (data[0][dataEnd] !== '' && dataStart === 0) dataStart = dataEnd;
            else if (data[0][dataEnd] === 'Turn') break;
        }

        for (const column of data) {
            if (column[0].startsWith('Account')) accountColumn = column;
            else if (column[0].startsWith('Balance')) balanceColumn = column;
            else if (column[3].startsWith('RP')) researchColumn = column;
            else if (column[3].startsWith('ResBudget')) researchBudgetColumn = column;
            else if (column[3].startsWith('Coefficient')) coefficientColumn = column;
        }

        //Adding balance to player accounts.
        for (let row = dataStart; row < dataEnd; row++) {
            accountColumn[row] -= balanceColumn[row];
            let failsafe = false;

            for (const [key, value] of Object.entries(cfg.users)) {
                if (value.nation === nationColumn[row]) {
                    let researchBudget = researchBudgetColumn[row];

                    researchColumn[row] += (researchBudget / 20000) * value.cf;
                    if (coefficientColumn[row] === researchBudget && value.cf < 2) {
                        cfg.users[key].cf += 0.1;
                    } else {
                        cfg.users[key].cf = 1;
                    }
                    coefficientColumn[row] = researchBudget;
                    failsafe = true;
                    break;
                }
            }
            //Checks for missing nations.
            if (!failsafe) {
                message.channel.send(`Cancelling turn process. Not all states are accounted for.`)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
            }
        }

        cfg.turn += 1;
        js.exportFile('config.json', cfg);
        let today = new Date();
        let dateTime = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
        accountColumn[dataEnd] = `${cfg.turn} ${message.author.username}`;
        accountColumn[dataEnd + 1] = dateTime;

        await setCellArray('A1', data, cfg.main);

        report(message, `Turn has been finished by <@${message.author.id}>`, this.name);
        message.client.channels.cache.get(cfg.servers[message.guild.id].announcements).send(`<@519315646606082052> Turn has been finished!`).catch(e => console.error(e));

    }
};