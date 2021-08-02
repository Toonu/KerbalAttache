const {ping, messageHandler, formatCurrency} = require("../utils"), cfg = require('./../config.json'),
    discord = require('discord.js'), {getCellArray} = require("../sheet");

module.exports = {
    name: 'balance',
    description: 'Command for getting the statistics about your state! Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}balance [USER]`,
    cooldown: 5,
    guildOnly: true,
    execute: async function balance(message) {
        function emojiFilter(reaction, user) {
            return (reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        //Getting user
        let nation = cfg.users[ping(message).id].nation;
        let data = await getCellArray('A1', cfg.mainCol, cfg.main, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        let accountColumn;
        let balanceColumn;
        let rpColumn;
        let rpBudgetColumn;
        let tilesColumn;
        let row = 0;

        //Getting row and columns.
        for (row; row < data[0].length; row++) {
            if (data[0][row] === nation) break;
        }

        for (let column = 0; column < data.length; column++) {
            if (data[column][cfg.mainAccountingRow].startsWith('Account')) accountColumn = column;
            else if (data[column][cfg.mainAccountingRow].startsWith('Balance')) balanceColumn = column;
            else if (data[column][cfg.mainRow].startsWith('RP')) rpColumn = column;
            else if (data[column][cfg.mainRow].startsWith('ResBudget')) rpBudgetColumn = column;
            else if (data[column][cfg.mainRow].startsWith('Tiles')) tilesColumn = column;
        }

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
                    value: `${new Intl.NumberFormat(cfg.moneyLocale, { minimumSignificantDigits: 3 }).format(data[rpColumn][row])} RP`,
                    inline: true
                },
                {name: 'Tiles:', value: data[tilesColumn][row]},
            )
            .setFooter('Made by the Attachè to the United Nations\nThis message will be auto-destructed in 32 seconds!', 'https://imgur.com/KLLkY2J.png');

        message.channel.send(embed).then(embedMessage => {
                embedMessage.react('❌').catch(err => console.error(err));
                embedMessage.awaitReactions(emojiFilter, {max: 1, time: 32000, errors: ['time']})
                    .then(collected => {
                        let react = collected.first();
                        if (react.emoji.name === '❌') embedMessage.delete();
                    })
                    .catch(() => embedMessage.delete());
            }).catch(error => console.error(error));
        message.delete().catch(error => console.error(error));
    }
}
