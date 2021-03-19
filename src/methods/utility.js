/** Utility file utility.js
@version 0.1
@author Jesse Thompson, @ninjagecko @
Includes helper utility functions that abstract more complicated functionality for seemingly mundane operations

Original code for deepEquals, arraysEqual, objectsEqual, mapsEqual typedArraysEqual from stackoverflow user @ninjagecko
https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript */

// Original code for toLocaleString alternate by @Eric Mahieu from https://stackoverflow.com/users/2225737/eric-mahieu

(function() {
    Number.prototype._toLocaleString = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function(locales,options) {
        if(options.style == "currency") {     // only format currencies.
            var prepend = "";
            if(options.currency == "EUR") {
            prepend = "\u20AC ";     // unicode for euro.
            }
            var val = this;
            val = val;
            
            // check if the toLocaleString really does nothing (ie Safari)
            
            var tempValue = val._toLocaleString(locales,options);
            if(tempValue == val.toString()) { // "broken"
            return prepend+val.formatMoney(2); // <-- our own formatting function.
            } else {
            return tempValue;
            }
        } else {
        return this._toLocaleString(locales,options);
        }
    };
    
    Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "," : d, 
    t = t == undefined ? "." : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
     };
   
    // demonstration code
//    var amount = 1250.75;
//    var formattedAmount = amount.toLocaleString('nl-NL', {style:'currency',currency: 'EUR'});
//    console.log(formattedAmount);

})();

export let debounce = function(a, b, c) {
    var d,e;return function(){function h(){d=null,c||(e=a.apply(f,g))}var f=this,g=arguments;return clearTimeout(d),d=setTimeout(h,b),c&&!d&&(e=a.apply(f,g)),e}
};

export function deepEquals(a,b) {
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

export function arraysEqual(a,b) {
    if (a.length!=b.length)
        return false;
    for(var i=0; i<a.length; i++)
        if (!deepEquals(a[i],b[i]))
            return false;
    return true;
}

export function objectsEqual(a,b) {
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

export function mapsEqual(a,b) {
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

export function typedArraysEqual(a,b) {
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
export let shuffleArray = function(array) {
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
export let parseId = function(encode, id) {
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
export let roundTime = function(time) {
    if (time.low) {
        time = time.low;
    }
    console.log(time);
    time = new Date(time).toLocaleString();
    console.log(time);
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

export const roundNumber = function(number) {
    return number;
}

export const shortenTitle = function (title, length = 70) {
    if (title) {
        if (title.length > length) {
            return title.slice(0, length) + "..";
        } else {
            return title;
        }
    }
}

/* Converts static document date into relevant publish time from now */
export const convertDate = function (date) {
    if (parseInt(date) != 1 && parseInt(date) != 2) { // prevent strange errors parsing old epoch date format
        date = new Date(parseInt(date)).toLocaleString();
    }
    if (date == "Invalid Date") {
        return null;
    }
    if (date) {
        let timeFromNow = (Date.now() - new Date(date).getTime())/1000;
        let days = (new Date(Date.now()) - new Date(date))/(1000*60*60*24);
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
        } else if (days > 1 && days < 7) {
            if (Math.round(days) == 1) {
                return "yesterday";
            } else {
                return Math.round(days) + " days ago";
            }
        } else if (days > 6 && days < 13) {
            return "a week ago";
        } else if (new Date(date).getDate() - new Date(Date.now()).getDate() > 12 && new Date(date).getDate() - new Date(Date.now()).getDate() < 17) {
            return "two weeks ago";
        } else {
            if (date) {
                if (date.match(/([a-zA-Z0-9].*),/)) {
                    return date.match(/([a-zA-Z0-9].*),/)[1];
                }
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

export const roundHour = function (hour) {
    if (Math.round(hour/3600) == 1) {
        return "1 hour ago";
    } else {
        return Math.round(hour/3600) + " hours ago";
    }
    return Math.round(hour/3600) + "hours ago";
}

/* Dynamically sets state when given the key/value location and the name of the key name to be used */
export const setStateDynamic = (key, value) => {
   if (value == "Invalid Date") {
       return { [key]: "No Date"};
   }
    return { [key]: value };
}

export const dataURItoBlob = (dataURI) => {
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
export const getPath = () => {
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
export const checkAtBottom = () => {
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

export const get = function(obj, key) {
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
export const opposite = function(value) {
    if (value) {
        return false;
    }
    return true;
}

export const setData = function(video, type) {
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

export const randomProperty = function(obj) {
    if (obj) {
        let keys = Object.keys(obj);
        return obj[ keys[ keys.length * Math.random() << 0]];
    } else {
        return null;
    }
}

export const returnLink = function(media, page = "history") {
    try {
        if (page == "history") {
            if (!media) {
                return { pathname:`/` };
            } else if (media.id.charAt(0) == "a") {
                return { pathname:`/read?${media.id}` };
            } else {
                return { pathname:`/watch?${media.id}` };
            }
        } else if (page == "results") {
            if (media.id) {
                return { pathname:`/read?a=${media.id}` };
            } else {
                return { pathname:`/watch?v=${media.mpd}` };
            }
        }
    } catch (err) {
        console.log(err);
        // Something went wrong
    }
}

export const returnProfile = function(media) {
    try {
        return { pathname:`/profile?p=${media.author}` };
    } catch (err) {
        // Something went wrong
    }
}

export const getNumber = function(data) {
    if (data.hasOwnProperty("high") && data.hasOwnProperty("low")) {
        if (data.high > data.low) {
            return data.high;
        } else {
            return data.low;
        }
    }
    return data;
}

// Sometimes records just dont have all the appropriate data. It happens. Don't panick. Resolve it
export const resolveString = function(variable) {
    if (variable) {
        if (variable.toString) {
            return variable.toString();
        }
    }
    return variable;
}

export const checkToString = function(value) {
    try {
        if (value) {
            if (value.toString) {
                return value.toString();
            }
        }
        return value;
    } catch (err) {
        return value;
    }
}

//module.exports = {
//    debounce: debounce,
//    deepEquals: deepEquals,
//    shuffleArray: shuffleArray,
//    parseId: parseId,
//    roundTime: roundTime,
//    shortenTitle: shortenTitle,
//    roundNumber: roundNumber,
//    setStateDynamic: setStateDynamic,
//    convertDate: convertDate,
//    dataURItoBlob: dataURItoBlob,
//    getPath: getPath,
//    checkAtBottom: checkAtBottom,
//    get: get,
//    opposite: opposite,
//    setData: setData,
//    randomProperty: randomProperty,
//    returnLink: returnLink,
//    returnProfile: returnProfile,
//    getNumber: getNumber,
//    resolveString: resolveString,
//    arraysEqual: arraysEqual
//}
