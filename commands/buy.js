const cfg = require('./../config.json'), units = require('./../units.json'), discord = require('discord.js'),
    {getCellArray, setCell, toColumn, getCell} = require("../sheet"),
    {messageHandler, formatCurrency, embedSwitcher, resultOptions, report} = require("../utils");
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

        //Checking input arguments.
        let amount = parseInt(args[0]);
        if (isNaN(amount)) {
            return messageHandler(message, new Error('InvalidTypeException: Argument is not a number.'), true);
        } else if (args[1] === undefined) {
            return messageHandler(message, new Error('InvalidArgumentException: Missing second argument.'), true);
        }
        let assetType = args[1].toUpperCase();
        if(!units.hasOwnProperty(assetType)) {
            return messageHandler(message, new Error('Asset not found.'), true);
        }

        let accountColumn;
        let nationRow = 0;
        let systemColumn = 0;
        let nation = cfg.users[message.author.id];
        let systemData;
        let systemBackup;

        //Getting systems tab data if system is being purchased.
        if (['wpSurface', 'wpAerial', 'systems'].includes(units[assetType][1])) {
            systemData = await getCellArray('A1', cfg.systemsCol, cfg.systems, true)
                .catch(error => {
                    return messageHandler(message, error, true);
                });
            for (systemColumn; systemColumn < systemData.length; systemColumn++) {
                if (systemData[systemColumn][cfg.mainRow] === assetType) break;
            }
            systemBackup = systemColumn;
        }

        let mainData = await getCellArray('A1', cfg.mainCol, cfg.main, true)
            .catch(error => {
                return messageHandler(message, error, true);
            });

        for (nationRow; nationRow < mainData[0].length; nationRow++) {
            if (mainData[0][nationRow] === nation.nation) break;
        }

        for (systemColumn = 0; systemColumn < mainData.length; systemColumn++) {
            if (mainData[systemColumn][cfg.mainAccountingRow] === 'Account') accountColumn = systemColumn;
            else if (!systemData && mainData[systemColumn][cfg.mainRow] === assetType) break;
        }

        systemData ? systemColumn = systemBackup : cfg.main;

        let oldAmount = await getCell(toColumn(systemColumn)+(nationRow+1), systemData ? cfg.systems : cfg.main);
        let account = await getCell(toColumn(accountColumn)+(nationRow+1), cfg.main);
        let unit = units[assetType];

        if (oldAmount + amount < 0) {
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
                { name: 'Asset', value: unit[0], inline: true},
                { name: 'Cost:', value: formatCurrency(amount < 0 ? unit[2]*amount*0.7 : unit[2]*amount)},
                { name: 'Do you accept the terms of the supplier agreement?', value: '✅/❌'},
                { name: '\u200B', value: '\u200B'},
            )
            .setFooter('Made by the Attachè to the United Nations', 'https://imgur.com/KLLkY2J.png');

        function filter(reaction, user) {
            return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
        }

        // noinspection JSUnusedLocalSymbols
        function processReactions(reaction, embedMessage) {
            if (reaction.emoji.name === '✅') {
                return resultOptions.confirm;
            } else if (reaction.emoji.name === '❌') {
                return resultOptions.delete;
            }
        }

        embedSwitcher(message, [embed], ['✅', '❌'], filter, processReactions)
            .then(result => {
                if (result === resultOptions.confirm) {
                    if (amount < 0) {
                        messageHandler(message, 'Selling assets. ✅ Do not forget to remove them from your map!' , true, 20000);
                        report(message, `${cfg.users[message.author.id].nation} has sold ${Math.abs(amount)} ${units[assetType][0]} for ${formatCurrency(Math.abs(unit[2]*amount))}`, this.name);
                    } else {
                        messageHandler(message, 'Purchasing assets. ✅ Do not forget to place them onto your map!' , true, 20000);
                        report(message, `${cfg.users[message.author.id].nation} has bought ${amount} ${units[assetType][0]} for ${formatCurrency(unit[2]*amount)}`, this.name);
                    }
                    setCell(`${toColumn(accountColumn)}${nationRow+1}`, amount < 0 ? account - unit[2]*amount*0.7 : account - unit[2]*amount, cfg.main);
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

    Object.keys(units).every(function(asset) {
        if (units[asset][2] === undefined) return false;
        if (asset.length > l) l = asset.length;
        return true;
    })

    Object.keys(units).every(function(asset) {
        if (units[asset][2] === undefined) return false;
        newMessage += `[${asset.padStart(l)}] | ${units[asset][0].padEnd(40)} : ${units[asset][2]}\n`;
        return true;
    })

    message.channel.send(`Available weapons:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
                .catch(error => console.error(error)));
        })
        .catch(error => console.error(error));
    return message.delete().catch(error => console.error(error));
}