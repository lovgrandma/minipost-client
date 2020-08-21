/** Utility file utility.js
@version 0.1
@author Jesse Thompson, @ninjagecko @
Includes helper utility functions that abstract more complicated functionality for seemingly mundane operations

Original code for deepEquals, arraysEqual, objectsEqual, mapsEqual typedArraysEqual from stackoverflow user @ninjagecko
https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript */

let debounce = function(a, b, c) {
    var d,e;return function(){function h(){d=null,c||(e=a.apply(f,g))}var f=this,g=arguments;return clearTimeout(d),d=setTimeout(h,b),c&&!d&&(e=a.apply(f,g)),e}
};

function deepEquals(a,b) {
    if (a instanceof Array && b instanceof Array)
        return arraysEqual(a,b);
    if (Object.getPrototypeOf(a)===Object.prototype && Object.getPrototypeOf(b)===Object.prototype)
        return objectsEqual(a,b);
    if (a instanceof Map && b instanceof Map)
        return mapsEqual(a,b);
    if (a instanceof Set && b instanceof Set)
        console.log("Error: set equality by hashing not implemented.");
        return false;
    if ((a instanceof ArrayBuffer || ArrayBuffer.isView(a)) && (b instanceof ArrayBuffer || ArrayBuffer.isView(b)))
        return typedArraysEqual(a,b);
    return a==b;  // see note[1] -- IMPORTANT
}

function arraysEqual(a,b) {
    if (a.length!=b.length)
        return false;
    for(var i=0; i<a.length; i++)
        if (!deepEquals(a[i],b[i]))
            return false;
    return true;
}

function objectsEqual(a,b) {
    var aKeys = Object.getOwnPropertyNames(a);
    var bKeys = Object.getOwnPropertyNames(b);
    if (aKeys.length!=bKeys.length)
        return false;
    aKeys.sort();
    bKeys.sort();
    for(var i=0; i<aKeys.length; i++)
        if (aKeys[i]!=bKeys[i]) // keys must be strings
            return false;
    return deepEquals(aKeys.map(k=>a[k]), aKeys.map(k=>b[k]));
}

function mapsEqual(a,b) {
    if (a.size!=b.size)
        return false;
    var aPairs = Array.from(a);
    var bPairs = Array.from(b);
    aPairs.sort((x,y) => x[0]<y[0]);
    bPairs.sort((x,y) => x[0]<y[0]);
    for(var i=0; i<a.length; i++)
        if (!deepEquals(aPairs[i][0],bPairs[i][0]) || !deepEquals(aPairs[i][1],bPairs[i][1]))
            return false;
    return true;
}

function typedArraysEqual(a,b) {
    a = new Uint8Array(a);
    b = new Uint8Array(b);
    if (a.length != b.length)
        return false;
    for(var i=0; i<a.length; i++)
        if (a[i]!=b[i])
            return false;
    return true;
}

/** Fisher-Yates shuffle https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
let shuffleArray = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Parses article id and any other uuid with 8, 4, 4, 4, 12 pattern: 0f64db58-1451-4931-bb55-434013efd774
let parseId = function(encode, id) {
    if (encode) {
        id = id.replace(/[-]/g, '');
    } else {
        for (let i = 0; i < id.length; i++) {
            if (i == 7 || i == 11 || i == 15 || i == 27) {
                id.splice(i, 0, "-");
            }
        }
    }
    return id;
}

/* Simplifies time format 00/00/0000, 0:00:00 AM to 00/00/00, 0:00 am */
let roundTime = function(time) {
    if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)) {
        if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] && time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2]) {
            return time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] + " " + time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2].toLowerCase();
        } else {
            return time;
        }
    } else {
        return time;
    }
    return time;
}

/* Dynamically sets state when given the key/value location and the name of the key name to be used */
let setStateDynamic = function(key, value) {
    return { [key]: value };
}

module.exports = {
    debounce: debounce,
    deepEquals: deepEquals,
    shuffleArray: shuffleArray,
    parseId: parseId,
    roundTime: roundTime,
    setStateDynamic: setStateDynamic
}
