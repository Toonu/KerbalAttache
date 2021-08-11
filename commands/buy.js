const cfg = require('./../config.json'), units = require('./../units.json'), discord = require('discord.js'),
    {getCellArray, setCell, toColumn, getCell} = require("../sheet"),
    {messageHandler, formatCurrency, embedSwitcher, resultOptions, report, log, ping} = require("../utils");
// noinspection JSCheckFunctionSignatures
module.exports = {
    name: 'buy',
    description: 'Command for buying new assets. Do NOT use in public channels.',
    args: 0,
    usage: `${cfg.prefix}buy [AMOUNT] [ASSET]
Assets do not need to be written in capital letters, the command is case insensitive.
**Assets:** can be listed via **${cfg.prefix}buy** command.`,
    cooldown: 5,
    guildOnly: true,
    execute: async function buy(message, args) {
        //No arguments lists the categories.
        if(!args[0]) return printAssets(message);

        let user = ping(message);

        //Checking input arguments.
        let amount = parseInt(args[0]);
        if (Number.isNaN(amount)) {
            return messageHandler(message, new Error('InvalidTypeException: Argument is not a number.'), true);
        } else if (!args[1]) {
            return messageHandler(message, new Error('InvalidArgumentException: Missing second argument.'), true);
        }
        let assetType = args[1].toUpperCase();
        if(!units.units[assetType]) {
            return messageHandler(message, new Error('Asset not found.'), true);
        }

        let isErroneous = false;
        let accountColumn;
        let nationRow = 0;
        let systemColumn = 0;
        let nation = cfg.users[user.id];
        let systemData;
        let systemBackup;
        let unit = units.units[assetType];

        //Getting systems tab data if system is being purchased.
        if ('system' === unit.type) {
            systemData = await getCellArray('A1', cfg.systemsEndCol, cfg.systems, true)
                .catch(error => {
                    isErroneous = true;
                    return messageHandler(message, error, true);
                });
            if (isErroneous) return;

            //Searching for column.
            for (systemColumn; systemColumn < systemData.length; systemColumn++) {
                if (systemData[systemColumn][cfg.mainRow] === assetType) break;
            }
            //Used to get systemsColumn back after it is looped through the mainData for loop.
            systemBackup = systemColumn;

            if (!systemColumn) return messageHandler(message, new Error('Could not find asset system column.'), true);
        }

        let mainData = await getCellArray('A1', cfg.mainEndCol, cfg.main, true)
            .catch(error => {
                isErroneous = true;
                return messageHandler(message, error, true);
            });
        if (isErroneous) return;

        //Searching for row and columns.
        for (nationRow; nationRow < mainData[0].length; nationRow++) {
            if (mainData[0][nationRow] === nation.nation) break;
        }
        for (systemColumn = 0; systemColumn < mainData.length; systemColumn++) {
            if (mainData[systemColumn][cfg.mainAccountingRow] === 'Account') accountColumn = systemColumn;
            else if (!systemData && mainData[systemColumn][cfg.mainRow] === assetType) break;
        }

        //Validating columns
        if (!systemColumn || !accountColumn || !nationRow)
            return messageHandler(message, new Error('Could not find one of columns.'), true);

        //If buying a system, reverting the systemData to old number found before.
        systemData ? systemColumn = systemBackup : undefined;

        let oldAmount = await getCell(toColumn(systemColumn)+(nationRow+1), systemData ? cfg.systems : cfg.main);
        let account = await getCell(toColumn(accountColumn)+(nationRow+1), cfg.main);

        //Validating cells being numbers and checking amounts.
        if (Number.isNaN(oldAmount) || Number.isNaN(account))
            return messageHandler(message, new Error('InvalidTypeException: Player account or bought asset is not' +
                ' number.'), true, 20000);
        else if (oldAmount + amount < 0) {
            return messageHandler(message, new Error('You cannot go into negative numbers of assets!'), true, 20000);
        }

        // noinspection JSCheckFunctionSignatures
        const embed = new discord.MessageEmbed()
            .setColor(nation.color)
            .setTitle(`${nation.demonym}'s Office of Acquisitions`)
            .setURL('https://discord.js.org/')
            .setThumbnail('https://imgur.com/IvUHO31.png')
            .addFields(
                { name: 'Amount:', value: amount, inline: true},
                { name: 'Asset:', value: unit.desc, inline: true},
                { name: 'Maitenance | Cost:', value: formatCurrency(unit.price * amount * 0.25) + ' | ' + formatCurrency(unit.price * amount * (amount < 0 ? 0.7 : 1))},
                { name: 'Do you accept the terms of the supplier agreement?', value: 'Press ✅/❌'},
                { name: '\u200B', value: '\u200B'},
            )
            .setFooter('Made by the Attachè to the United Nations', 'https://imgur.com/KLLkY2J.png');
        
        // noinspection JSUnusedLocalSymbols
        function processReactions(reaction) {
            if (reaction.emoji.name === '✅') {
                return resultOptions.confirm;
            } else if (reaction.emoji.name === '❌') {
                return resultOptions.delete;
            }
        }
    
        function filterYesNo(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }
    
        embedSwitcher(message, [embed], ['✅', '❌'], filterYesNo, processReactions)
            .then(result => {
                if (result === resultOptions.confirm) {
                    if (amount < 0) {
                        messageHandler(message, 'Selling assets. ✅ Do not forget to remove them from your map!' , true, 20000);
                        report(message, `${cfg.users[message.author.id].nation} has sold ${Math.abs(amount)} ${unit.name} for ${formatCurrency(Math.abs(unit.price*amount*0.7))}`, this.name);
                    } else {
                        messageHandler(message, 'Purchasing assets. ✅ Do not forget to place them onto your map!' , true, 20000);
                        report(message, `${cfg.users[message.author.id].nation} has bought ${amount} ${unit.name} for ${formatCurrency(unit.price*amount)}`, this.name);
                    }
                    setCell(`${toColumn(accountColumn)}${nationRow+1}`, account - unit.price * amount * (amount < 0 ? 0.7 : 1), cfg.main);
                    setCell(`${toColumn(systemColumn)}${nationRow+1}`, oldAmount+amount, systemData ? cfg.systems : cfg.main);
                } else {
                    messageHandler(message, 'Operation was canceled or timed out. ❌', true);
                }
            })
            .catch(error => messageHandler(message, error, true));
    }
};

function printAssets(message) {
    let newMessage = ``, l = 0;

    Object.keys(units.units).forEach(asset => {
        if (asset.length > l) l = asset.length;
    });
    Object.keys(units.units).forEach(asset => {
        newMessage += `[${asset.padStart(l)}] | ${units.units[asset].desc.padEnd(40)} : ${formatCurrency(units.units[asset].price)}\n`;
    });

    message.channel.send(`Available weapons:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
                .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
    return message.delete().catch(error => log(error, true));
}