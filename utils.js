const fs = require('fs'), cfg = require('./config.json');

module.exports = {
    /**
     * Function formats a number into currency locale specified by the configuration.
     * @param {number} num  to convert.
     * @return {string}     returns formatted number string.
     */
    formatCurrency: function formatCurrency(num) {
        return num.toLocaleString(cfg.moneyLocale, {style: 'currency', currency: cfg.money});
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
        exports.log(content);
        message.client.channels.cache.get(cfg.servers[message.guild.id].mainid).send(`[${dateTime.padEnd(21)}UTC] [${command}]: ${content}`)
            .catch(networkError => console.error(networkError));
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
            console.error(`[ERR][${dateTime} UTC] ${content}`);
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
            exports.log(`${content.message}\n${content.stack}`);
            content = content.message;
        }
        message.channel.send(content)
            .then(msg => msg.delete({timeout: timer}).catch(error => exports.log(error, true)))
            .catch(networkError => exports.log(networkError, true));
        if (deleteMessage) message.delete().catch(error => exports.log(error, true));
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
        if (!message) throw new Error('Invalid Argument Exception: Message is undefined.')

        let nation = message.author;

        if (message.mentions.users.first()) {
            if (exports.perm(message, level, false)) {
                nation = message.mentions.users.first();
            } else {
                exports.messageHandler(message, 'You lack sufficient clearance to do this for tagged player. Defaulting to yourself.')
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
        if (!message || !level || isNaN(level)) throw new Error('InvalidArgumentException: Message or level is undefined.');
        if (message.channel.type === 'dm') return true;

        let clearance = false;
        switch (level) {
            case 1:
                clearance = (cfg.servers[message.guild.id].developers.some(r => message.member.roles.cache.has(r))
                    || cfg.servers[message.guild.id].administrators.some(r => message.member.roles.cache.has(r)));
                break;
            case 2:
                clearance = (cfg.servers[message.guild.id].administrators.some(r => message.member.roles.cache.has(r)));
                break;
            default:
                break;
        }

        if (!clearance && showMessage === true)
            exports.messageHandler(message, 'Directorate of Information apologies. Your clearance is not sufficient for this operation. Please contact the moderators if you deem this as an error.');
        return clearance;
    },

    /**
     * Function creates new user of id with attributes of nation, color, sheet and map. Returns string message the user was created successfully.
     * @param {string} id           user discord id
     * @param {string} nationIn     nation name
     * @param {string} demonymIn    nation demonym
     * @param {string} colorIn      color hex number
     * @param {string} map          map URL
     * @return {string}             Returns string response of attributes of created user or throws an error message.
     * @throws {Error}              Throws Exceptions if the user already exists or the specified ID is undefined/NaN.
     */
    createUser: function createUser(id, nationIn = 'undefined', demonymIn = 'undefined', colorIn = "fffffe", map = 'https://discord.com/') {
        if (!id || Number.isNaN(id)) {
            throw new Error('InvalidArgumentException: User ID is undefined!') ;
        } else if (cfg.users[id]) {
            throw new Error('InvalidOperationException: User already exists!');
        }

        //Adds user to the json file.
        cfg.users[id] = {
            nation: nationIn,
            demonym: demonymIn,
            color: colorIn,
            cf: 1,
            map: map,
            notes: " ",
        }

        exports.exportFile("config.json", cfg);
        return`Nation ${nationIn} created for user <@${id}>`
    },

    /**
     * Function exports json file from JSON object.
     * @param file  Filename to export.
     * @param data  JSON Object to write in.
     */
    exportFile: function exportFile(file, data) {
        fs.writeFileSync(file, JSON.stringify(data, null, 4));
    }
}

