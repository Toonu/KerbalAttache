const {exportFile} = require("../jsonManagement");
cfg = require('./../config.json');
module.exports = {
    name: 'reject',
    description: 'Command for rejecting trade transaction proposal!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,

    /**
     * Function accepts trade proposal.
     * @param message               Message object.
     * @return {Promise<void>}      Returns nothing.
     */
    execute: async function reject(message) {
        let data = cfg.trade[message.author.id];
        if (data === undefined) {
            message.channel.send('No trade exists and therefore none can be rejected.')
        } else {
            delete cfg.trade[message.author.id];
            exportFile('config.json', cfg);
        }
    }
};