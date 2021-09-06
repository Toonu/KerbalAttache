const {prefix} = require('../database.json');
const assets = require(`../dataImports/assets.json`);
const discord = require('discord.js');
const {messageHandler, formatCurrency, embedSwitcher, resultOptions, report, log, ping} = require("../utils");
const {findAsset} = require('../sheet');


// noinspection JSCheckFunctionSignatures
module.exports = {
    name: 'buy',
    description: 'Command for buying new assets. Do NOT use in public channels.',
    args: 0,
    usage: `${prefix}buy [AMOUNT] [ASSET]
Assets do not need to be written in capital letters, the command is case insensitive.
**Assets:** can be listed via **${prefix}buy** command.`,
    cooldown: 5,
    guildOnly: true,
    usesDB: true,
    execute: async function buy(message, args, db) {
        //No arguments will switch to listing the assets and systems in the game.
        if(!args[0]) return printAssets(message);
        let state = db.getState(ping(message));
        let amount = parseInt(args[0]);
        
        //Validating input arguments.
        if (Number.isNaN(amount)) {
            return messageHandler(message, new Error('InvalidTypeException: Argument is not a number.'), true);
        } else if (!args[1]) {
            return messageHandler(message, new Error('InvalidArgumentException: Missing second asset type argument.'), true);
        } else if (!state) {
            return messageHandler(message, new Error('NullReferenceException: State not found!!'));
        }
        
        //Getting asset or system.
        let asset;
        try {
            asset = findAsset(args[1]);
        } catch (error) {
            return messageHandler(message, error, true);
        }
        
        
        //Validating asset or system and user assets status.
        if (!asset) {
            return messageHandler(message, new Error('NullReferenceException: Asset not found!'));
        }
        
        // noinspection JSCheckFunctionSignatures
        const embed = new discord.MessageEmbed()
            .setColor(state.colour)
            .setTitle(`${state.demonym}'s Office of Acquisitions`)
            .setURL('https://discord.js.org/')
            .setThumbnail('https://imgur.com/YGlmh22.png')
            .addFields(
                { name: 'Amount:', value: amount, inline: true},
                { name: 'Asset:', value: asset.desc, inline: true},
                { name: 'Maitenance | Cost:', value: `${formatCurrency(asset.cost * amount * 0.25)} | ${formatCurrency(asset.cost * amount * (amount < 0 ? 0.7 : 1))}`},
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
                                        try {
                        //Throws error on negative assets or money.
                        state.assets.modify(asset, amount, state);
                    } catch (error) {
                        if (!error.message.startsWith('Warn')) {
                            return messageHandler(message, error, true);
                        } else {
                            messageHandler(message, error);
                        }
                    }
                    db.export();
                    messageHandler(message, `${amount < 0 ? 'Selling' : 'Buying'} assets. ✅ Do not forget to ${amount < 0 ? 'remove them from' : 'place them to'} your map!` , true, 20000);
                    report(message, `${state.name} has ${amount < 0 ? 'sold' : 'bought'} ${Math.abs(amount)} ${asset.name} for ${formatCurrency(Math.abs(asset.cost * amount * (amount < 0 ? 0.7 : 1)))}.`, this.name);
                } else {
                    messageHandler(message, 'Operation was canceled or timed out. ❌', true);
                }
            })
            .catch(error => messageHandler(message, error, true));
    }
};

function printAssets(message) {
    let newMessage = ``, l = 0;
    
    Object.values(assets).forEach(type => {
        Object.keys(type).forEach(name => {
            if (name.length > l) {
                l = name.length;
            }
        })
    });
    
    for (const type of Object.values(assets)) {
        // noinspection JSCheckFunctionSignatures
        for (const [name, asset] of Object.entries(type)) {
            newMessage += `[${name.padStart(l)}] | ${asset.desc.padEnd(40)} : [${formatCurrency(asset.cost)}]\n`;
        }
    }
    
    message.channel.send(`Available weapons:\n\`\`\`ini\n${newMessage}\`\`\``, {split: {prepend: `\`\`\`ini\n`, append: `\`\`\``}})
        .then(assetMessages => {
            assetMessages.forEach(submissionMessage => submissionMessage.delete({timeout: 30000})
                .catch(error => log(error, true)));
        })
        .catch(error => log(error, true));
    return message.delete().catch(error => log(error, true));
}