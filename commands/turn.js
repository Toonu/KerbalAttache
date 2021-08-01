const cfg = require('./../config.json'), js = require('../utils'),
    {setCellArray, getCellArray} = require("../sheet"), {report} = require("../game");
const {toColumn} = require("../utils");
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
        let rpColumn;
        let rpBudgetColumn;
        let coefficientColumn;
        let nationColumn = 0;
        let dataStart = 0;
        let dataEnd = 0;

        //Getting amount of nations.
        for (dataEnd; dataEnd < data[0].length; dataEnd++) {
            if (data[0][dataEnd] !== '' && dataStart === 0) dataStart = dataEnd;
            else if (data[0][dataEnd] === 'Turn:') break;
        }

        //Getting column integers.
        for (let column = 0; column < data.length; column++) {
            if (data[column][0].startsWith('Account')) accountColumn = column;
            else if (data[column][0].startsWith('Balance')) balanceColumn = column;
            else if (data[column][3].startsWith('RP')) rpColumn = column;
            else if (data[column][3].startsWith('ResBudget')) rpBudgetColumn = column;
            else if (data[column][3].startsWith('Coefficient')) coefficientColumn = column;
        }

        //Check
        if (!accountColumn || !balanceColumn || !rpColumn || !rpBudgetColumn || !coefficientColumn
            || dataStart || dataEnd) {
            message.channel.send(`Cancelling turn process. Not all sheet columns were found.`)
                .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                .catch(networkError => console.error(networkError));
            return console.error(`Cancelling turn process. Not all sheet columns were found.`);
        }

        //Accounting balance and research.
        for (let row = dataStart; row < dataEnd; row++) {
            let account = data[accountColumn][row];
            let balance = data[balanceColumn][row];

            //Check for number.
            if (Number.isNaN(account) || Number.isNaN(balance)) {
                message.channel.send(`Cancelling turn process. Not all accounting columns are numbers.`)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
                return console.error(`Cancelling turn process. Not all accounting columns are numbers.`);
            }

            account += balance;
            let failsafe = false;

            //Going through saved config users to find respective data.
            for (const [key, value] of Object.entries(cfg.users)) {
                if (value.nation === data[nationColumn][row]) {
                    let researchBudget = data[rpBudgetColumn][row];

                    //Check for number
                    if (Number.isNaN(researchBudget)) {
                        message.channel.send(`Cancelling turn process. Not all research columns are numbers.`)
                            .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                            .catch(networkError => console.error(networkError));
                        return console.error(`Cancelling turn process. Not all research columns are numbers.`);
                    }

                    //Research coefficient calculation and updating.
                    data[rpColumn][row] += (researchBudget / 20000) * value.cf;
                    if (data[coefficientColumn][row] === researchBudget) {
                        if (value.cf < 2) {
                            cfg.users[key].cf += 0.1;
                        }
                    } else {
                        cfg.users[key].cf = 1;
                    }
                    data[coefficientColumn][row] = researchBudget;
                    failsafe = true;
                    break;
                }
            }
            //Checks for missing config nations.
            if (!failsafe) {
                message.channel.send(`Cancelling turn process. Not all states are accounted for.`)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
                return console.error(`Cancelling turn process. Not all states are accounted for.`);
            }
        }

        //Adding turn data to the bottom of the sheet.
        let today = new Date();
        data[accountColumn][dataEnd] = `${cfg.turn} ${message.author.username}`;
        data[accountColumn][dataEnd + 1] = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

        cfg.turn += 1;

        //Point of no return. Modifying real online data bellow.
        js.exportFile('config.json', cfg);

        let accountColLetter = toColumn(accountColumn);
        let rpColLetter = toColumn(rpColumn);
        await setCellArray( `${accountColLetter}1`, [data[accountColumn]], cfg.main, true)
            .catch(error => {
                message.channel.send(`Cancelling turn process. Some values has been modified and must be checked.`)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
                return console.error(error);
            });
        await setCellArray(`${rpColLetter}1`, [data[rpColumn], data[rpBudgetColumn], data[coefficientColumn]], cfg.main, true)
            .catch(error => {
                message.channel.send(`Cancelling turn process. Some values has been modified and must be checked.`)
                    .then(errorMessage => errorMessage.delete({timeout: 9000}).catch(error => console.error(error)))
                    .catch(networkError => console.error(networkError));
                return console.error(error);
            });

        //Logging and announcing.
        report(message, `Turn has been finished by <@${message.author.id}>.`, this.name);
        let server = cfg.servers[message.guild.id];
        message.client.channels.cache.get(server.announcements).send(`<@&${server.headofstate}> Turn ${cfg.turn} has been finished!`)
            .catch(error => console.error(error));
    }
};