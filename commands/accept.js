const {report, findVertical, transfer} = require('./../game'), cfg = require('./../config.json'),
    {exportFile} = require("../utils");
module.exports = {
    name: 'accept',
    description: 'Command for accepting trade transaction proposal!',
    args: false,
    usage: '',
    cooldown: 5,
    guildOnly: true,

    /**
     * Function accepts trade proposal.
     * @param message               Message object.
     * @return {Promise<void>}      Returns nothing.
     */
    execute: async function accept(message) {
        let data = cfg.trade[message.author.id];
        if (data === undefined) {
            return message.channel.send('No trade exists and therefore none can be accepted.')
        }

        let nationRow = data.nationRow;
        let columnRow = data.unitCol;
        let money = data.money;
        let amount = data.amount;
        let type = data.type;
        let tab = data.tab;
        let args = data.transaction;
        let unit = data.unit;
        let msg = data.message;

        findVertical(cfg.users[message.author.id].nation, 'A')
            .then(customerRow => {
                transfer(nationRow, columnRow, amount, money, msg, type, tab)
                    .then(() => {
                        transfer(customerRow, columnRow, amount, money, msg, !type, tab)
                            .then(() => {
                                try {
                                    report(message, `<@${msg.author.id}>'s ${args} transaction of ${amount} ${unit}s for ${money.toLocaleString('fr-FR', { style: 'currency', currency: cfg.money })} was accepted by <@${message.author.id}>!`, this.name);
                                    message.channel.send(`Transaction was accepted and delivered!`)
                                        .then(msg => msg.delete({timeout: 10000}));
                                    delete cfg.trade[message.author.id];
                                    exportFile('config.json', cfg);
                                } catch (e) {
                                    message.channel.send(e);
                                }
                            })
                            .catch(err => {
                                message.channel.send(err);
                                delete cfg.trade[message.author.id];
                                exportFile('config.json', cfg);
                            })
                    })
                    .catch(err => {
                        message.channel.send(err);
                        delete cfg.trade[message.author.id];
                        exportFile('config.json', cfg);
                    })
            })
            .catch(err => message.channel.send(err));
    }
};