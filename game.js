const fs = require('fs');
const {google} = require('googleapis');
const fn = require("./fn");
const gm = require("./game");
var client;
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
                    return e;
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
                    return height
                }
            }
        })
        reject("Error");
    });
}

exports.findUnitPrice = async function(unit, message) {
    return new Promise((resolve, reject) => {
        var ax;
        var ay;
        findVertical("Data", "A", message)
        .then(x => {
            ax = x;
            message.channel.send(ax + x);
            findHorizontal(unit, "4", message).then(y => {
                ay = y;
                message.channel.send(ay + y);
            })
        })
        .then(wtf => {
            message.channel.send("AHWHADUIADHADHADW" + ax + wtf);
            fn.ss(["get", `${ax}${ay}`], message, true, "Maintenance")
        })
        
    })
}