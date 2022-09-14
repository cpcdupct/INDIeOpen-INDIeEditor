function getFormDataFromJson(data) {
    var urlEncodedData = '';
    var urlEncodedDataPairs = [];

    for (var name in data) {
        urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }

    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
    return urlEncodedData;
}

function toBase64(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        })
    );
}

function findIndexObjectInArray(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        var element = array[i];
        if (element[key] == value) return i;
    }

    return -1;
}

function findObjectInArray(array, key, value) {
    var index = findIndexObjectInArray(array, key, value);
    if (index != -1) return array[index];
    return undefined;
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);

    if (n > len) throw new RangeError('getRandom: more elements taken than available');

    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }

    return result;
}
