const cfg = require('./../config.json'), {setCellArray, getCellArray, toColumn} = require("../sheet"),
    {messageHandler, log, report, perm, exportFile} = require("../utils");
module.exports = {
    name: 'turn',
    description: 'Command for finishing turn and updating the sheet data!',
    args: 0,
    usage: `${cfg.prefix}turn`,
    cooldown: 5,
    guildOnly: true,
    execute: async function turn(message) {
        if(!perm(message, 2)) return;
        let isErroneous = false;

        let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });

        if(isErroneous) return;

        let accountColumn;
        let balanceColumn;
        let rpColumn;
        let rpBudgetColumn;
        let coefficientColumn;
        let dataStart = 0;
        let dataEnd = 0;
        let nationColumn = 0;

        //Getting amount of states.
        for (dataEnd; dataEnd < data[0].length; dataEnd++) {
            if (data[0][dataEnd] !== '' && !dataStart) dataStart = dataEnd;
            else if (data[0][dataEnd] === 'Turn:') break;
        }

        //Getting column integers.
        for (let column = 0; column < data.length; column++) {
            if (data[column][cfg.mainAccountingRow].startsWith('Account')) accountColumn = column;
            else if (data[column][cfg.mainAccountingRow].startsWith('Balance')) balanceColumn = column;
            else if (data[column][cfg.mainRow].startsWith('RP')) rpColumn = column;
            else if (data[column][cfg.mainRow].startsWith('ResBudget')) rpBudgetColumn = column;
            else if (data[column][cfg.mainRow].startsWith('Coefficient')) coefficientColumn = column;
        }

        //Check if any of the columns were not found.
        if (!accountColumn || !balanceColumn || !rpColumn || !rpBudgetColumn || !coefficientColumn
            || !dataStart || !dataEnd)
            return messageHandler(message, new Error(`NotFoundException: Cancelling turn process. Not all sheet columns were found.`), true);

        //Calculating balance and research.
        for (let row = dataStart; row < dataEnd; row++) {

            //Check for number in calculations.
            if (Number.isNaN(data[accountColumn][row]) || Number.isNaN(data[balanceColumn][row]))
                return messageHandler(message, new Error(`InvalidTypeException: Cancelling turn process. Not all accounting columns contains numbers.`), true);
            //Accounting
            data[accountColumn][row] += data[balanceColumn][row];

            //Going through saved config users to find respective research coefficient data.
            for (const [key, value] of Object.entries(cfg.users)) {
                //Setting failsafe in case the nation is not found in any of the defined users.
                isErroneous = true;
                if (value.nation === data[nationColumn][row]) {
                    let researchBudget = data[rpBudgetColumn][row];

                    //Check for number in research.
                    if (Number.isNaN(researchBudget))
                        return messageHandler(message, new Error(`InvalidTypeException: Cancelling turn process. Not all research columns contains numbers.`), true);

                    //Calculating and accounting the research coefficient and research points. Updating the user CFs.
                    data[rpColumn][row] += (researchBudget / 20000) * value.cf;
                    if (data[coefficientColumn][row] === researchBudget) {
                        if (value.cf < 2)
                            cfg.users[key].cf += 0.1;
                    } else cfg.users[key].cf = 1;

                    //Updating data and turning off failsafe after the nation was found.
                    isErroneous = false;
                    data[coefficientColumn][row] = researchBudget;
                    break;
                }
            }
            //Checks for missing config nations.
            if (isErroneous)
                return messageHandler(message, new Error(`NotFoundException: Cancelling turn process. Not all states are accounted for.`), true);
        }

        //Updating turn data and writing it to the bottom of the sheet.
        cfg.turn += 1;
        let today = new Date();
        data[accountColumn][dataEnd] = `${cfg.turn} ${message.author.username}`;
        data[accountColumn][dataEnd + 1] = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

        //Point of no return. Modifying real online data bellow.
        exportFile('config.json', cfg);

        let accountColLetter = toColumn(accountColumn);
        let rpColLetter = toColumn(rpColumn);
        await setCellArray( `${accountColLetter}1`, [data[accountColumn]], cfg.main, true)
            .catch(error => {
                log(`Cancelling turn process. Accounting values has already been modified and must be reverted.`, true);
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        await setCellArray(`${rpColLetter}1`, [data[rpColumn], data[rpBudgetColumn], data[coefficientColumn]], cfg.main, true)
            .catch(error => {
                log(`Cancelling turn process. Research values has already been modified and must be reverted.`, true);
                isErroneous = true;
                return messageHandler(message, error, true);
            });

        if(isErroneous) return;

        //Logging and announcing.
        report(message, `Turn has been finished by <@${message.author.id}>.`, this.name);
        let server = cfg.servers[message.guild.id];
        // noinspection JSUnresolvedFunction,JSUnresolvedVariable
        //message.client.channels.cache.get(server.announcements).send(`<@&${server.headofstate}> Turn ${cfg.turn}
        // has been finished!`)
        //    .catch(error => log(error, true));
    }
};