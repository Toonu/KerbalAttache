const fs = require('fs');
const {google} = require('googleapis');
const fn = require("./fn");
const gm = require("./game");
const cfg = require("./config.json")


async function findHorizontal(target, height, message) {
    return new Promise((resolve, reject) => {
        var e = 64;
        fn.ss(["getA", `A${height}`, `BA${height}`], message, true, "Maintenance")
        .then(array => {
            for (const element of array[0]) {
                e += 1;
                //message.channel.send(e + ":" + element);
                if (element == target) {
                    message.channel.send("Result: " + e);
                    resolve(e);
                }
            }
            reject("Error");
        })
    })
};


async function findVertical(target, col, message) {
    return new Promise((resolve, reject) => {  
        fn.ss(["getA", `${col}1`, `${col}100`], message, true, "Maintenance")
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
        })
        reject("Error");
    });
}

exports.findUnitPrice = async function(unit, message) {
    return new Promise(function(resolve, reject) => {
        var ay;
        ax = await findVertical("Data", "A", message);
        message.channel.send(ax + x);
        ay = await findHorizontal(unit, "4", message);
        message.channel.send(ay + y);
        fn.ss(["get", `${ax}${ay}`], message, true, "Maintenance")
    })
}