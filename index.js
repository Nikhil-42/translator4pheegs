plaintext_area = document.getElementById("plaintext"); // Save a reference to the plaintext input area
ciphertext_area = document.getElementById("ciphertext"); // Save a reference to the ciphertext input area
last_plaintext = plaintext_area.value; // Save the initial values of the text areas for update comparison
last_ciphertext = ciphertext_area.value;

base = { "0": "A", "1": "T", "2": "C", "3": "G" }; // Define the conversion from numbers to code

encoder = { // Define the characters from letters to code
    "a": "Aat", "b": "Aac", "c": "Aag", "d": "Ata", "e": "Att", "f": "Atc", "g": "Atg", "h": "Aca", "i": "Act", "j": "Acc", "k": "Acg", "l": "Aga", "m": "Agt", "n": "Agc", "o": "Agg", "p": "Taa", "q": "Tat", "r": "Tac", "s": "Tag", "t": "Tta", "u": "Ttt", "v": "Ttc", "w": "Ttg", "x": "Tca", "y": "Tct", "z": "Tcc",
    "A": "AAT", "B": "AAC", "C": "AAG", "D": "ATA", "E": "ATT", "F": "ATC", "G": "ATG", "H": "ACA", "I": "ACT", "J": "ACC", "K": "ACG", "L": "AGA", "M": "AGT", "N": "AGC", "O": "AGG", "P": "TAA", "Q": "TAT", "R": "TAC", "S": "TAG", "T": "TTA", "U": "TTT", "V": "TTC", "W": "TTG", "X": "TCA", "Y": "TCT", "Z": "TCC",
    "á": "Áat", "é": "Átt", "í": "Áct", "ó": "Ágg", "ú": "Ṫtt", "ü": "Ťtt", "ñ": "Ãgc",
    "Á": "ÁAT", "É": "ÁTT", "Í": "ÁCT", "Ó": "ÁGG", "Ú": "ṪTT", "Ü": "ŤTT", "Ñ": "ÃGC",
    ".": "aaa", "¿": "ttt", "?": "ttt", "¡": "ccc", "!": "ccc", ",": "aat", "'": "aac", "#": "ggc",
};

// Converts from plaintext to ciphertext
encode = function (plaintext) {

    // Handle characters
    ciphertext = "";
    // Go through each character of the plaintext
    for (c in plaintext) {
        char = plaintext[c];
        if (char in encoder) { // If it has an encoding...
            ciphertext += encoder[char]; // ...lookup its encoding
        } else {
            ciphertext += plaintext[c]; // Otherwise just preserve the character
        }
    }

    // Handle numbers
    ciphertext = ciphertext.replace(
        /\d+(?:(?:aat)\d{3})*(?:(?:aaa)\d+)?/g, // Look for a sequence of digits separated by commas and/or a period
        number_str => "ggg" + Number(number_str.replaceAll("aat", "").replace("aaa", ".")).toString(4).replace(/\d/g, n => base[n]).replace(".", "aaa")
    );

    // Handle the emoticon idioms
    ciphertext = ciphertext.replaceAll("<gggG", "<G");

    return ciphertext;
};

// Generate the inverse dictionary of the encoder map
decoder = {};
for (plaintext in encoder) {
    decoder[encoder[plaintext]] = plaintext;
}

// Generate the inverse dictionary of the base map
debase = {};
for (num in base) {
    debase[base[num]] = num;
}

// Converts from ciphertext to plaintext (operation must occur in the opposite order of the encoder)
decode = function (ciphertext) {

    // Handle emoticon idioms
    ciphertext = ciphertext.replaceAll("<G", "<gggG");

    // Handle numbers
    ciphertext = ciphertext.replace(
        /ggg[ATCG]+(?:(?:aat)[ATCG]+)*(?:(?:aaa)[ATCG]+)?/g, // Look for 'ggg' followed by base symbols separated by commas and/or a period
        number_str => { halves = number_str.substring(3).replace(/[ATCG]/g, n => debase[n]).replace("aaa", ".").split("."); return (parseInt(halves[0], 4) + (halves.length == 2 ? (parseInt(halves[1], 4) / 4 ** halves[1].length) : 0)); }
    );

    // Handle characters
    plaintext = "";
    // Go through each set of 3 characters in the ciphertext
    for (c = 0; c < ciphertext.length;) {
        char = ciphertext.substring(c, c + 3);
        if (char in decoder) { // If it has a decoding...
            plaintext += decoder[char]; // ...lookup its decoding...
            c += 3; // ...move to the next set of 3 characters
        } else { // Otherwise...
            plaintext += ciphertext[c]; // ...preserve the first character...
            c += 1; // ...and move the head past it
        }
    }

    // Special case for inferring punctuation orientation for Spanish
    // If the punctuation is followed by text (or other punctuation which is followed by text) flip it
    plaintext = plaintext.replace(/\?(?=(?:\!|\?)*[a-zA-Z])/g, "¿"); 
    plaintext = plaintext.replace(/\!(?=(?:\!|\¿)*[a-zA-Z])/g, "¡");

    return plaintext;
};

// Returns a function which sets the background to the give url
make_bg = function (url) {
    return function () { document.body.style.backgroundImage = "url('" + url + "')"; };
};

// Maps keywords to actions which should be performed when they are typed
keywords = {
    "love": make_bg('https://media.istockphoto.com/photos/heart-bokeh-background-picture-id508495114?b=1&k=20&m=508495114&s=170667a&w=0&h=Vr2ke8oeH3aKWqmy6nUQ6UVJUj1sVSihfzp48Zm4Wyo='),
    "<3": make_bg('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbSFBEsp29IjSy4UK2w04BOcT7djzT4HTIXA&usqp=CAU'),
    "surf": make_bg('https://wallpaperaccess.com/full/486709.jpg'),
    "dragon": make_bg('resources/4DragonBG.png'),
}

// Returns a list denoting all the words which have been changed between `original` and `updated`
find_changed_words = function (original, updated) {
    original_words = original.split(' '); // Split text into word list
    updated_words = updated.split(' ');
    changed_words = []; // Allocate a place to store words found to have changed

    o_i = 0; // index in `original` word list
    c_i = 0; // index in `changed` word list
    while (o_i < original_words.length && c_i < updated_words.length) { // Loop while both indices are valid
        if (original_words[o_i] == updated_words[c_i]) { // If the words match...
            o_i++; // ...advance both indices
            c_i++;
        } else { // Otherwise...
            changed_words.push(updated_words[c_i]); // ...add the word to `changed_words`
            c_i++; // ...advance the `changed` word list index
            if (original_words[o_i] != updated_words[c_i]) { // Check that an extra word wasn't added
                o_i++; // advance the `original` word list index
            }
        }
    }

    // Check for words appended to the end string
    for (i = c_i; i < updated_words.length; i++) {
        changed_words.push(updated_words[i]);
    }

    return changed_words;
};

// Called to update both the plaintext and ciphertext areas
// opt: 1 == encode
// opt: -1 == decode
// opt: 0 == infer based on most recently changed field
convert = function (opt) {
    if (opt == 1 || (opt == 0 && plaintext_area.value != last_plaintext)) {
        ciphertext_area.value = encode(plaintext_area.value);
    } else if (opt == -1 || (opt == 0 && ciphertext_area.value != last_ciphertext)) {
        plaintext_area.value = decode(ciphertext_area.value);
    }

    // Generate the list of changed words after conversion
    find_changed_words(last_plaintext, plaintext_area.value).forEach(word => {
        (keywords[word] || function () { })(); // If one of the words is a `keyword` call its function
    });

    if (Date.now() > 165042720000) {
        plaintext_area.value = "Happy Birthday!!!";
        ciphertext_area.value = "TtaAtt TatTttActAttTacAgg AgtTttAagAcaAgg <ATG";
        make_bg("https://media.istockphoto.com/vectors/realistic-3d-glossy-balloons-vector-id669645470?k=20&m=669645470&s=612x612&w=0&h=EmlHqnZT87rQj32R3OEJ619EoD_e5FT8jQbBjPhzOhg=")();
        alert("ACAAatTaaTaaTct AACActTacTtaAcaAtaAatTctcccccccccccccccccccccccccccccc");
    }

    // Update the last_---text values
    last_ciphertext = ciphertext_area.value;
    last_plaintext = plaintext_area.value;
};

// Clears the element with the given id
wipe = function (id) {
    document.getElementById(id).value = "";
    convert(0);
};

// Copies the content of the element with the give id to the clipboard
copy = function (id) {
    navigator.clipboard.writeText(document.getElementById(id).value);
}