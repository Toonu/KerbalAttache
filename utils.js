const fs = require('fs');
const {resultOptions} = require('./utils');
const db = require('./database.json');

module.exports = {
    /**
     * Function formats a number into currency locale specified by the configuration.
     * @param {number} num  to convert.
     * @return {string}     returns formatted number string.
     */
    formatCurrency: function formatCurrency(num) {
        return num.toLocaleString(db.moneyLocale, {style: 'currency', currency: db.money});
    },

    /**
     * Function reports information into the moderator channel and logs it into the console.
     * @param {module:"discord.js".Message} message     specifies server to search main channel in.
     * @param {string} content                          content to forward.
     * @param {string} command                          command name the content originated from.
     */
    report: function report(message, content, command = '') {
        let today = new Date();
        let dateTime = `${today.getUTCFullYear()}.${(today.getUTCMonth() < 10 ? '0' : '') + (today.getUTCMonth() + 1)}.${(today.getUTCDate() < 10 ? '0' : '') + today.getUTCDate()} ${today.getUTCHours()}:${(today.getUTCMinutes() < 10 ? '0' : '') + today.getUTCMinutes()}:${(today.getUTCSeconds() < 10 ? '0' : '') + today.getUTCSeconds()}`;
        module.exports.log(content);
        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
        message.client.channels.cache.get(db.channelReporting).send(`[${dateTime.padEnd(21)}UTC] [${command}]: ${content}`)
            .catch(networkError => log(networkError, true));
    },

    /**
     * Function formats and logs content to the console with a timestamp.
     * @param {string} content      content to log.
     * @param {boolean} erroneous   is true if console.error should used.
     */
    log: function log(content, erroneous = false) {
        let today = new Date();
        let dateTime = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
        if (erroneous) {
            if (content instanceof Error) {
                console.error(`[ERR][${dateTime} UTC] ${content.message}\n${content.stack}`);
            }
            else {
                console.error(`[ERR][${dateTime} UTC] ${content}`);
            }
        } else {
            console.log(`[LOG][${dateTime} UTC] ${content}`);
        }
    },

    /**
     * Function reports an error or a log to the console and the Discord channel of the original message.
     * <br>&nbsp;&nbsp;
     * <br>Functions also logs the content into the console if the content type is of Error.
     * @param {module:"discord.js".Message} message                                     message for channel to reply in.
     * @param content {string || module:"discord.js".MessageEmbed || Error || Array}    forwarded object.
     * @param {boolean} deleteMessage                                                   true if the original message should be deleted afterwards.
     * @param timer {number}                                                            timeout for the message deletion.
     */
    messageHandler: function messageHandler(message, content, deleteMessage = false,timer = 10000) {
        if (content instanceof Error) {
            module.exports.log(`${content.message}\n${content.stack}`);
            content = content.message;
        }
        message.channel.send(content)
            .then(msg => msg.delete({timeout: timer}).catch(error => module.exports.log(error, true)))
            .catch(networkError => module.exports.log(networkError, true));
        if (deleteMessage) {
            message.delete().catch(error => module.exports.log(error, true));
        }
    },

    /**
     * Function checks if message contains a user ping and the message originates from the moderator.
     * <br>&nbsp;&nbsp;
     * <br>If there is ping, returns the pinged user if the clearance is sufficient, alternatively returns the message author.
     * @param message {module:"discord.js".Message}     message which is analysed.
     * @param level {number}                            Clearance level to check. Defaults to administrator.
     * @return {module:"discord.js".User}               Returns pinged user when exists or message author.
     * @throws {Error}                                  Throws Error when the message is undefined.
     */
    ping: function ping(message, level = 2) {
        if (!message) {
            throw new Error('Invalid Argument Exception: Message is undefined.')
        }

        let nation = message.author;

        if (message.mentions.users.first()) {
            if (module.exports.perm(message, level, false)) {
                nation = message.mentions.users.first();
            } else {
                module.exports.messageHandler(message, 'You lack sufficient clearance to do this for tagged player. Defaulting to yourself.')
            }
        }
        return nation;
    },

    /**
     * Function checks message author clearance level against the defined level.
     * @param {module:"discord.js".Message} message     message whose author clearance is checked.
     * @param {number} level                            Clearance level number. 1 for developer, 2 for administrator.
     * @param {boolean} showMessage                     true if a rejecting message should be written as a reply to the author's message.
     * @returns {boolean}                               Returns true if author has clearance, else false.
     * @throws {Error}                                  Throws Error when message or level is undefined.
     */
    perm: function perm(message, level, showMessage = true) {
        if (!message || !level || Number.isNaN(level)) {
            throw new Error('InvalidArgumentException: Message or level is' +
                ' undefined.');
        }
        if (message.channel.type === 'dm') {
            return true;
        }

        let clearance = false;
        switch (level) {
            case 1:
                // noinspection JSUnresolvedVariable
                clearance = (db.developers.some(r => message.member.roles.cache.has(r))
                    || db.administrators.some(r => message.member.roles.cache.has(r)));
                break;
            case 2:
                // noinspection JSUnresolvedVariable
                clearance = (db.administrators.some(r => message.member.roles.cache.has(r)));
                break;
            default:
                break;
        }

        if (!clearance && showMessage === true)
            {
                module.exports.messageHandler(message, 'Directorate of Information apologies. Your clearance is not sufficient for this operation. Please contact the moderators if you deem this as an error.');
            }
        return clearance;
    },

    /**
     * Function exports json file from JSON object.
     * @param file  Filename to export.
     * @param data  JSON Object to write in.
     */
    exportFile: function exportFile(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, 4));
    },

    resultOptions: Object.freeze({"delete":1, "confirm":2, "moveRight":3, "moveLeft":4}),

    /**
     * Method switches between embeds.
     * @param {module:"discord.js".Message} message                 Message channel to print embeds in.
     * @param {Array<module:"discord.js".MessageEmbed>} embeds      Embeds Array to print.
     * @param {Array<string>} reactions                             String emoji reactions to place on the message.
     * @param {Function} emojiFilter                        Function to filter reactions. First argument being a reaction and second an user.
     * @param {Function} processReactions                   Function to process filtered reactions. First argument being a reaction and second an embed message.
     * @return {Promise<Error || Number>}                        Returns undefined or an Error message.
     */
    embedSwitcher: async function embedSwitcher(message, embeds, reactions, emojiFilter, processReactions) {
        return new Promise(async function (resolve, reject) {
            let i = 0;
            let final = false;
            while (true) {
                await awaitEmbedReaction(message, reactions, embeds[i], emojiFilter, processReactions)
                    .then(result => {
                        switch (result) {
                            case module.exports.resultOptions.delete:
                            case module.exports.resultOptions.confirm:
                                //return here kills merely result anonymous function, have to do this to return outside.
                                final = true;
                                resolve(result);
                                break;
                            case module.exports.resultOptions.moveLeft:
                                i--;
                                if (i === -1) {
                                    i += embeds.length;
                                }
                                break;
                            case module.exports.resultOptions.moveRight:
                                i++;
                                //Ensures infinite closed loop.
                                if (i === embeds.length) {
                                    i = 0;
                                }
                                break;
                            default:
                        }
                    })
                    .catch(error => {
                        return reject(error);
                    });

                //Closes the embed loop.
                if (final) {
                    return;
                }
            }
        })
    },
    processYesNo: function processYesNo(reaction) {
        if (reaction.emoji.name === '✅') {
            return resultOptions.confirm;
        } else if (reaction.emoji.name === '❌') {
            return resultOptions.delete;
        }
    }
};


/**
 * Function is a support function to the embedSwitcher to utilize await in a loop there.
 * Function prints an embed and reacts to it, while awaiting reactions filtered by emojiFilter and handled by processReactions function.
 * @private
 * @param {module:"discord.js".Message} message         Message channel to print embeds in.
 * @param {Array<string>} reactions                     String emoji reactions to place on the message.
 * @param {module:"discord.js".MessageEmbed} embed      Embed to print.
 * @param {Function} emojiFilter                        Function to filter reactions. First argument being a reaction and second an user.
 * @param {Function} processReactions                   Function to process filtered reactions. First argument being a reaction and second an embed message.
 * @return {Promise<Error || Number>}                   Returns Error or resultOptions enum.
 */
async function awaitEmbedReaction(message, reactions, embed, emojiFilter, processReactions) {
    return new Promise(function (resolve, reject) {
        message.channel.send(embed)
            .then(embedMessage => {

                //Reacting with emojis.
                for (const reaction of reactions) {
                    embedMessage.react(reaction).catch(error => {
                        embedMessage.delete().catch(error => module.exports.log(error, true));
                        return reject(error);
                    });
                }

                //Processing reactions.
                embedMessage.awaitReactions(emojiFilter, {max: 1, time: 60000, errors: ['time']})
                    .then(async collectedReactions => {
                        let result = processReactions(collectedReactions.first(), embedMessage);
                        await embedMessage.delete().catch(error => module.exports.log(error, true));
                        return resolve(result);
                    })
                    .catch(() => {
                        embedMessage.delete().catch(error => module.exports.log(error, true));
                        return resolve(module.exports.resultOptions.delete);
                    });
            }).catch(error => {
            return reject(error);
        });
    })
}

