const {ping, messageHandler, formatCurrency, log, embedSwitcher, resultOptions} = require("../utils"),
    cfg = require('./../config.json'), discord = require('discord.js'), {getCellArray} = require("../sheet");

module.exports = {
    name: 'balance',
    description: 'Command for getting the statistics about your state! Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}balance [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function balance(message) {
        //Getting user
        let isErroneous = false;
        let nation = cfg.users[ping(message).id].nation;
        let data = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        if (isErroneous) return;
        else if (!nation) {
            return messageHandler(message, new Error('InvalidArgumentEception: User not found!'), true);
        }

        let accountColumn;
        let balanceColumn;
        let rpColumn;
        let rpBudgetColumn;
        let tilesColumn = 0;
        let row = 0;

        //Getting rows and columns.
        for (row; row < data[0].length; row++) {
            if (data[0][row] === nation) break;
        }

        for (tilesColumn; tilesColumn < data.length; tilesColumn++) {
            if (data[tilesColumn][cfg.mainAccountingRow].startsWith('Account')) accountColumn = tilesColumn;
            else if (data[tilesColumn][cfg.mainAccountingRow].startsWith('Balance')) balanceColumn = tilesColumn;
            else if (data[tilesColumn][cfg.mainRow].startsWith('RP')) rpColumn = tilesColumn;
            else if (data[tilesColumn][cfg.mainRow].startsWith('ResBudget')) rpBudgetColumn = tilesColumn;
            else if (data[tilesColumn][cfg.mainRow].startsWith('Tiles')) break;
        }

        if (!row || !accountColumn || !balanceColumn || !rpColumn || !rpBudgetColumn || !tilesColumn) {
            return messageHandler(message, new Error('One of the columns or rows have not been found.'), true);
        }

        // noinspection JSCheckFunctionSignatures
        const embed = new discord.MessageEmbed()
            .setColor('#e0b319')
            .setTitle(`National Bank of ${nation}`)
            .setURL('https://discord.js.org/') //URL clickable from the title
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                {name: 'Nation:', value: nation},
                {
                    name: 'Account:',
                    value: formatCurrency(data[accountColumn][row])
                },
                {
                    name: 'Balance:',
                    value: formatCurrency(data[balanceColumn][row])
                },
                {
                    name: 'Research budget:',
                    value: formatCurrency(data[rpBudgetColumn][row]),
                    inline: true
                },
                {
                    name: 'Research points:',
                    value: `${new Intl.NumberFormat(cfg.moneyLocale,
                        { minimumSignificantDigits: 3 }).format(data[rpColumn][row])} RP`,
                    inline: true
                },
                {name: 'Tiles:', value: data[tilesColumn][row]},
            )
            .setFooter('Made by the Attachè to the United Nations\nThis message will be auto-destructed in 32' +
                ' seconds!', 'https://imgur.com/KLLkY2J.png');


        // noinspection JSUnusedLocalSymbols
        function processReactions(reaction) {
            if (reaction.emoji.name === '❌') return resultOptions.delete;
        }

        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        await embedSwitcher(message, [embed], ['❌'], emojiFilter, processReactions)
            .then(() => message.delete().catch(error => log(error, true)))
            .catch(error => messageHandler(message, error, true));
    }
};
