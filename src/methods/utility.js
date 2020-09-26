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

const roundNumber = function(number) {
    return number;
}

const shortenTitle = function (title, length = 70) {
    if (title) {
        if (title.length > length) {
            return title.slice(0, length) + "..";
        } else {
            return title;
        }
    }
}

/* Converts static document date into relevant publish time from now */
const convertDate = function (date) {
    if (date) {
        let timeFromNow = (Date.now() - new Date(date).getTime())/1000;
        if (timeFromNow <= 60) {
            return "1 minute ago";
        } else if (timeFromNow <= 120) {
            return "2 minutes ago";
        } else if (timeFromNow <= 180) {
            return "3 minutes ago";
        } else if (timeFromNow <= 300) {
            return "5 minutes ago";
        } else if (timeFromNow <= 600) {
            return "10 minutes ago";
        } else if (timeFromNow <= 900) {
            return "15 minutes ago";
        } else if (timeFromNow <= 1200) {
            return "20 minutes ago";
        } else if (timeFromNow <= 1800) {
            return "Half an hour ago";
        } else if (timeFromNow <= 3600) {
            return "1 hour ago";
        } else if (timeFromNow < 86400) {
            return roundHour(timeFromNow); // Rounds hour for hours uploaded from now
        } else if (new Date(Date.now()).getDate() - new Date(date).getDate() == 1) {
            return "yesterday";
        } else {
            if (date.match(/([a-zA-Z0-9].*),/)) {
                return date.match(/([a-zA-Z0-9].*),/)[1];
            } else {
                date = date.split(' ')[0];
                return date.substring(0, date.length -1);
            }
        }
        date = date.split(' ')[0];
        return date.substring(0, date.length -1);
    }
    return null;
}

const roundHour = function (hour) {
    if (Math.round(hour/3600) == 1) {
        return "1 hour ago";
    } else {
        return Math.round(hour/3600) + " hours ago";
    }
    return Math.round(hour/3600) + "hours ago";
}

/* Dynamically sets state when given the key/value location and the name of the key name to be used */
const setStateDynamic = (key, value) => {
    return { [key]: value };
}

const dataURItoBlob = (dataURI) => {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
}

/* Returns correct location pathname. Application sometimes interprets query params under window.location.search or the whole path under pathname.
    Without this method, when traversing back through history, appropriate content may not update
    */
const getPath = () => {
    if (window) {
        if (window.location) {
            if (window.location.search) {
                if (window.location.search.length > 0) {
                    return window.location.pathname + window.location.search; // This will return majority of the time
                }
            }
            return window.location.pathname;
        }
    }
    return false;
}

// author: enqtran/[ReactJS] Detect Scrolls To Bottom
// https://gist.github.com/enqtran/25c6b222a73dc497cc3a64c090fb6700
const checkAtBottom = () => {
    try {
        if (window && document) {
            if (document.documentElement) {
                const windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
                const body = document.body;
                const html = document.documentElement;
                const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                const windowBottom = windowHeight + window.pageYOffset;
                if (windowBottom >= docHeight) {
                    return true;
                }
            }
        }
        return false;
    } catch (err) {
        return false;
    }
}

const get = function(obj, key) {
    try {
        return key.split(".").reduce(function(o, x) {
            return (typeof o == "undefined" || o === null) ? o : o[x];
        }, obj);
    } catch (err) {
        return false;
    }
}

// Returns opposite value, useful for determining whether to allow user to like, dislike something
// User has not liked yet? Pass true to like
const opposite = function(value) {
    if (value) {
        return false;
    }
    return true;
}

const setData = function(video, type) {
    try {
        if (!video._fields[0].properties[type] || video._fields[0].properties[type].length == 0 || video._fields[0].properties[type] == undefined) {
            return video._fields[0].properties[type] = "";
        }
        return video._fields[0].properties[type]
    } catch (err) {
        // Component may have unmounted
        return "";
    }
}

module.exports = {
    debounce: debounce,
    deepEquals: deepEquals,
    shuffleArray: shuffleArray,
    parseId: parseId,
    roundTime: roundTime,
    shortenTitle: shortenTitle,
    roundNumber: roundNumber,
    setStateDynamic: setStateDynamic,
    convertDate: convertDate,
    dataURItoBlob: dataURItoBlob,
    getPath: getPath,
    checkAtBottom: checkAtBottom,
    get: get,
    opposite: opposite,
    setData: setData
}
