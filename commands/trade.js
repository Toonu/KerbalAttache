module.exports = {
    name: 'trade',
    description: 'Command for setting trade value of assets you have traded! When you purchase or sell an asset, you should put the price you paid here.',
    args: true,
    usage: '<sell/buy> <money> <assetType> <numberOfAssets> <@customer>\n\n**Assets:**\n*Buildings:* AIRPORT, FOB, PORT, RADAR\n*Surface assets:* MBT, AFV, IFV, APC, SAM, SPAAG, SF\n*Aerospace assets:* L, M, H, LA, VL, VTOL, SAT, OV\n*Naval assets:* K, F, DD, CC, BC, BB, CL, CV\n**Weapons:**\n*Aerial:* SRAAM, MRAAM, LRAAM, AGM, ASHM, ATGM, SRSAM ,MRSAM, LRSAM, SEAD\n*Surface:* CRUISE, BALLISTIC, ABM, ASM\n*Bombs:* UNGUI, GUI, EW, RECON, FUEL, GUNPOD',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message, args) { 
        const cfg = require("./../config.json")
        const fn = require("./../fn");
        const gm = require("./../game");
        const js = require("./../json")
        const units = require('./../units.json');

        try {
            args[1] = parseInt(args[1]);
            args[3] = parseInt(args[3]);
            let nation = cfg.users[message.author.id].nation;
            let type = args[0].toLowerCase();
            let unit = args[2].toUpperCase();

            if(!units.hasOwnProperty(unit)) throw 'AssetType not found. Please retry.'
            if (isNaN(args[0]) || isNaN(args[1])) throw 'Argument money or number of assets is not a number. Canceling operation.';
            if (!type.startsWith('sell') && !type.startsWith('buy')) throw 'First argument is not sell or buy.';
            if (nation == undefined) throw 'Nation does not exist in our database. Contact moderator or retry.';
        } catch(err) {
            message.channel.send(err);
            return;
        }

        gm.findUnitPrice(unit, message, nation)
        .then(data => {
            if (data[0] == false) {
                data[0] = 0;
            } else {
                data[0] = parseInt(data[0].replace(/[,|$]/g, ''));
            }
            fn.ss(['get', `${fn.toCoord(data[1])+(data[2])}`], message)
                .then(amount => {
                    amount = parseInt(amount);
                    fn.ss(['set', `${fn.toCoord(data[1])+(data[2])}`, data[0] + amount], message)
                        .then(result => {
                            gm.findUnitPrice(type, message, nation)
                            .then(trade => {
                                if (trade[0] == false) {
                                    trade[0] = 0;
                                } else {
                                    trade[0] = parseInt(trade[0].replace(/[,|$]/g, ''));
                                }
                                fn.ss(['set', `${fn.toCoord(trade[1])+(trade[2])}`, trade[0] + amount], message)
                                .then(fin => {
                                    gm.report(message, `<@${message.author.id}> has traded ${args[3]} of ${unit} with ${message.mentions.users.first().id} for ${args[1]}!`);
                                })
                            })
                        }).catch(err => console.error(err));
                }).catch(err => console.error(err));
        })
        .catch(err => console.error(err));    
    },
};