module.exports = {
    name: 'turn',
    description: 'Command to finish turn and calculate the chart data!',
    args: false,
    usage: '<true> if revert',
    cooldown: 5,
    guildOnly: true,
    execute: async function execute(message) {
        const cfg = require('./../config.json')
        const js = require('../jsonManagement');
        const fn = require('./../fn')
        const gm = require('./../game');

        if(!js.perm(message, 2)) {
            return;
        }

        let newResearch = [];
        let coefficient = [];

        gm.findHorizontal('RP', 4, message)
        .then(techCol => {
            techCol = fn.toCoord(techCol);
            gm.findVertical('Data', 'A', message)
            .then(endRow => {
                fn.ss(['getA', `A5`, `C${endRow - 1}`], message)
                .then(balanceArray => {
                    fn.ss(['getA', `${techCol}5`, `${techCol + (endRow - 1)}`, 2, 0], message)
                    .then(researchArray => {
                        balanceArray.forEach(r => {
                            r[1] = parseInt(r[1].replace(/[,|$]/g, ''));
                            r[2] = parseInt(r[2].replace(/[,|$]/g, ''));
                            r[1] += r[2];
                            r.splice(2, 1);
                        })

                        for (const [key, value] of Object.entries(cfg.users)) {
                            coefficient.push([value.nation, value.cf, key]);
                        }

                        let i = 0;
                        researchArray.forEach(r => {
                            r[0] = parseFloat(r[0]);
                            r[1] = parseInt(r[1].replace(/[,|$]/g, ''));
                            r[2] = parseInt(r[2].replace(/[,|$]/g, ''));
                            r.push(balanceArray[i][0]);
                            r.push(false);
                            i++;

                            for(nation of coefficient) {
                                if(nation[0] === r[3]) {
                                    newResearch.push([r[0] + ((nation[1] * r[1])/20000), r[1], r[1]])
                                    r[4] = true;
                                    if (r[1] === r[2] && cfg.users[nation[2]].cf <= 2) {
                                        cfg.users[nation[2]].cf += 0.1;
                                    }
                                }
                            }
                        })

                        js.exportFile('config.json', cfg);


                        balanceArray.forEach(r => {
                            r.splice(0, 1);
                        })

                        fn.ss(['setA', 'B5', balanceArray], message);
                        fn.ss(['setA', techCol+5, newResearch], message);

                        //console.log(coefficients);
                        //console.log(newResearch);
                        //console.log(balanceArray);
                    })
                })
            })
        })
    }
};