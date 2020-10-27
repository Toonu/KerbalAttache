const fs = require('fs');
const {google} = require('googleapis');
const fn = require("./fn");
const gm = require("./game");
const cfg = require("./config.json")


async function findHorizontal(target, height, message, bool) {
    return new Promise(function (resolve, reject) {
        var e = 64; //char A dec num
        fn.ss(["getA", `A${height}`, `BA${height}`], message, bool, "Maintenance")
        .then(array => {
            for (const element of array[0]) {
                e += 1;
                //message.channel.send(e + ":" + element);
                if (element == target) {
                    message.channel.send("Result: " + e);
                    resolve(e);
                }
            }
            reject("Not found in horizontal range.X");
        }).catch(reject("Not found in horizontal range."));
    })
};


async function findVertical(target, col, message, bool) {
    return new Promise(function (resolve, reject) {  
        fn.ss(["getA", `${col}1`, `${col}100`], message, bool, "Maintenance")
        .then(array => {
            var height = 0
            for (const element of array) {
                //message.channel.send(height + ":" + element);
                height += 1;
                if (element[0] == target) {
                    //message.channel.send("Final" + height);
                    resolve(height);
                }
            }
            reject("Not found in vertical range.X");
        }).catch(reject("Not found in horizontal range."));
    });
}

exports.findUnitPrice = async function(unit, message) {
    return new Promise(async function(resolve, reject) {
        var ax = await findVertical("Data", "A", message, false).catch("Error Vertical");
        message.channel.send(ax);
        var ay = await findHorizontal(unit, "4", message, false).catch("Error Horizontal");
        message.channel.send(ay);
        var result = await fn.ss(["get", `${ax}${ay}`], message, true, "Maintenance");
        resolve(result);
    })
}