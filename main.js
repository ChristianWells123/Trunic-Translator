//  text-to-ipa.js

//  This file creates a global TextToIPA object containing the public loadDict
//  and lookup methods as well as the associated private helper objects and methods.

//  The purpose of this program is to look up an english word in an english-to-ipa
//  dictionary via lookup() and return an IPAWord to tell if an english word
//  has multiple IPA pronunciations, as well as the IPA text itself (pronunciations
//  included).

// NOTE: This program implies that the CMU IPA dictionary (http://people.umass.edu/nconstan/CMU-IPA/)
// will be used to get IPA translations. This dictionary is by default included with this
// program under the name 'ipadict.txt'. This _WILL NOT WORK_ with any other IPA dictionary.

//      TextToIPA.loadDict(location)
//          location    Location to load the dictionary from. Since it's gotten
//                      with an XMLHttpRequest, it can be on the local machine or
//                      remote
//          This method produces no output, but will take the location of the
//          dictionary and parse it into the _IPADict object for fast lookups
//          with the lookup method. This method _NEEDS_ to be ran before lookup(),
//          so ideally you would want to run this when the window loads.

//      TextToIPA.lookup(word)
//          word        English word that will be searched for in the IPA Dict
//          This method returns an IPAWord that has an error attribute, and
//          a text attribute. The error determines if the word exists in IPA,
//          if the word has multiple pronunciations. The text is the resulting
//          IPA text of the lookup. See converter-form.js for how to utilize this.

// ESLint settings. We want console logging and some problems may exist
// with undefined objects (TextToIPA) but we check for these
// beforehand
/* eslint-disable no-console, no-undef */

// Create a TextToIPA object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.
if (typeof TextToIPA !== 'object') {
  TextToIPA = {};
}

(function () {
  'use strict';

  // Objects

  // Create the ipadict if one does not currently exist. This is important,
  // as reloading the dict takes long, so if one already exists, let it be.
  if (typeof TextToIPA._IPADict !== 'object') {
    TextToIPA._IPADict = {};
  }

  // Create a constructor for an IPAWord that makes displaying them and
  // associated errors much easier.
  // NOTE: This need not exist outside this program.
  function IPAWord(error, text) {
    this.error = error;
    this.text = text;
  }

  // Functions

  if (typeof TextToIPA._parseDict !== 'function') {
    TextToIPA._parseDict = function (lines) {
      console.log('TextToIPA: Beginning parsing to dict...');

      // Fill out the IPA dict by
      // 1) regexing the word and it's corresponding IPA translation into an array
      // 2) using the word as the key and the IPA result as the pair
      for (var i in lines) {
        var arr = lines[i].split(/\s+/g);
        TextToIPA._IPADict[arr[0]] = arr[1];
      }

      console.log('TextToIPA: Done parsing.');
      //replaceRecursively(document.body);
    };
  }

  // Load the dictionary. Can be on the local machine or from a GET request.
  if (typeof TextToIPA.loadDict !== 'function') {
    TextToIPA.loadDict = function (location) {
      console.log('TextToIPA: Loading dict from ' + location + '...');

      if (typeof location !== 'string') {
        console.log('TextToIPA Error: Location is not valid!');
      } else {

        var txtFile = new XMLHttpRequest();

        txtFile.open('GET', location, true);

        txtFile.onreadystatechange = function () {
          // If document is ready to parse...
          if (txtFile.readyState == 4) {
            // And file is found...
            if (txtFile.status == 200 || txtFile.status == 0) {
              // Load up the ipa dict
              TextToIPA._parseDict(txtFile.responseText.split('\n'));
              replaceRecursively(document.body)
            }
          }
        };

        txtFile.send(null);


      }

    };

  }

  // Lookup function to find an english word's corresponding IPA text
  // NOTE: This method implies that the CMU IPA dictionary (http://people.umass.edu/nconstan/CMU-IPA/)
  // has been loaded with loadDict(). This dictionary is by default included with this
  // program under the name 'ipadict.txt'. This _WILL NOT WORK_ with any other IPA dictionary.
  if (typeof TextToIPA.lookup !== 'function') {

    TextToIPA.lookup = function (word) {

      if (Object.keys(TextToIPA._IPADict).length === 0) {
        console.log('TextToIPA Error: No data in TextToIPA._IPADict. Did "TextToIPA.loadDict()" run?');
      } else {
        // It is possible to return undefined, so that case should not be ignored
        if (typeof TextToIPA._IPADict[word] != 'undefined') {

          // Some words in english have multiple pronunciations (maximum of 4 in this dictionary)
          // Therefore we use a trick to get all of them

          // Resulting error, null since we don't know if this word has multiple
          // pronunciations
          var error = null;
          // Text, defaults to the IPA word. We build on this if multiple
          // pronunciations exist
          var text = TextToIPA._IPADict[word];

          var texts = text.split(",");
          if (texts.length > 1) {
            error = 'multi';
          }
          text = texts[0];
          text = text.replaceAll("\u02c8", '')
            .replaceAll("\u02cc", '')
            .replaceAll("\u03b8", 'T')
            .replaceAll("/", '');
          //console.log('replaced');
          // Return the new word
          return new IPAWord(error, text);

        } else {
          return new IPAWord('undefined', word);
        }

      }

    };

  }

}());

// Load dict
// Could be intensive, might only want to load when necessary
function separatePunctation(string) {
  var symbols = ("!?.,()[]{}-+=_/\\*<>:;\"\'|\u201d\u201c");
  var beginPunctuation = "";
  var endPunctuation = "";
  var temp = string;
  while (symbols.indexOf(temp[0]) !== -1) {
    beginPunctuation = beginPunctuation + temp[0];
    temp = temp.substring(1, temp.length);
  }
  while (symbols.indexOf(temp[temp.length - 1]) !== -1) {
    endPunctuation = temp[temp.length - 1] + endPunctuation;
    temp = temp.substring(0, temp.length - 1);
  }
  return { word: temp, beginPunc: beginPunctuation, endPunc: endPunctuation };
}

function replaceWithIPA(string) {
  words = string.split(" ");
  //log(words)
  for (var i = 0; i < words.length; i++) {
    separation = separatePunctation(words[i]);
    words[i] = separation.word;
    var beginPunctuation = separation.beginPunc;
    var endPunctuation = separation.endPunc;
    lookup = TextToIPA.lookup(words[i])
    ipa = lookup.text;
    error = lookup.error;
    //console.log("replaced " + words[i] + " with " + ipa);
    words[i] = ipa;
    words[i] = beginPunctuation + words[i] + endPunctuation;
  }
  out = "";
  for (var i = 0; i < words.length; i++) {
    out = out + words[i] + " ";
  }
  return { text: out, err: error };

}

function replaceRecursively(element) {
  element.innerHTML = element.innerHTML.replace(/(?<!(<\/?[^>]*|&[^;]*))([^\s<]+)/g, '$1<span class="translate-to-ipa">$2</span>');
  spans = document.getElementsByClassName("translate-to-ipa")

  Array.prototype.forEach.call(spans, function (element) {
    currText = element.textContent
    replacedText = replaceWithIPA(currText.toLowerCase());
    if (replacedText.err == "undefined") {
      element.classList.add("exclude-trunic");
    } else {
      element.textContent = replacedText.text;
      element.classList.add("use-trunic");
    }
    //element.classList.remove("translate-to-ipa");
  });
  html = element.innerHTML;
  var htmlLength = 0;
  while (htmlLength != html.length) {
    htmlLength = html.length;
    html = html.replace(/(<span[^<>]*>)([\s\S]*?)(<\/span>)(\s*)\1([\s\S]*?)\3/gi, "$1$2$4$5$3");
  }
  Array.from(document.querySelectorAll('.translate-to-ipa')).forEach(function (el) {
    el.classList.remove('translate-to-ipa');
  });

};

function startsWithVowel(word) {
  var vowels = ("aeiouAEIOU\u00e6\u0251\u0065\u0329\u0259\u026a\u025c\u028a");
  return vowels.indexOf(word[0]) !== -1;
}

function separatePunctation(string) {
  var symbols = ("!?.,()[]{}-+=_/\\*<>:;\"\'|\u201d\u201c");
  var beginPunctuation = "";
  var endPunctuation = "";
  var temp = string;
  while (symbols.indexOf(temp[0]) !== -1) {
    beginPunctuation = beginPunctuation + temp[0];
    temp = temp.substring(1, temp.length);
  }
  while (symbols.indexOf(temp[temp.length - 1]) !== -1) {
    endPunctuation = temp[temp.length - 1] + endPunctuation;
    temp = temp.substring(0, temp.length - 1);
  }
  return { word: temp, beginPunc: beginPunctuation, endPunc: endPunctuation };
}

function replaceWithIPA(string) {
  words = string.split(" ");
  //log(words)
  for (var i = 0; i < words.length; i++) {
    separation = separatePunctation(words[i]);
    words[i] = separation.word;
    var beginPunctuation = separation.beginPunc;
    var endPunctuation = separation.endPunc;
    lookup = TextToIPA.lookup(words[i])
    ipa = lookup.text;
    error = lookup.error;
    //console.log("replaced " + words[i] + " with " + ipa);
    words[i] = ipa;
    words[i] = beginPunctuation + words[i] + endPunctuation;
  }
  out = "";
  for (var i = 0; i < words.length; i++) {
    out = out + words[i] + " ";
  }
  return { text: out, err: error };

}

var replaceRecursively = function (element) {
  element.innerHTML = element.innerHTML.replace(/(?<!(<\/?[^>]*|&[^;]*))([^\s<]+)/g, '$1<span class="translate-to-ipa">$2</span>');
  spans = document.getElementsByClassName("translate-to-ipa")

  Array.prototype.forEach.call(spans, function (element) {
    currText = element.textContent
    replacedText = replaceWithIPA(currText.toLowerCase());
    if (replacedText.err == "undefined") {
      element.classList.add("exclude-trunic");
    } else {
      element.textContent = replacedText.text;
      element.classList.add("use-trunic");
    }
    //element.classList.remove("translate-to-ipa");
  });
  html = element.innerHTML;
  var htmlLength = 0;
  while (htmlLength != html.length) {
    htmlLength = html.length;
    html = html.replace(/(<span[^<>]*>)([\s\S]*?)(<\/span>)(\s*)\1([\s\S]*?)\3/gi, "$1$2$4$5$3");
  }
  Array.from(document.querySelectorAll('.translate-to-ipa')).forEach(function (el) {
    el.classList.remove('translate-to-ipa');
  });

};

/* 
function replaceRecursively(element) {
  if (element.childNodes.length) {
      element.childNodes.forEach(child => replaceRecursively(child));
  } else {
      const cont = element.textContent;
      if (cont) element.textContent = replaceWithIPA(element.textContent);
  }
}; */

let fontUrl = chrome.runtime.getURL('resources/Trunic.woff');

let font = new FontFace("Trunic", "url('" + fontUrl + "')");
document.fonts.add(font);

let dictUrl = chrome.runtime.getURL('resources/en_US.txt');
TextToIPA.loadDict(dictUrl);
