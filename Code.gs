/*
Copyright 2014-2024 Shlomi Helfgot

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
כל המביא דבר בשם אומרו מביא גאולה לעולם
*/



const SETTINGS = ["meforash_replace", "meforash_replacement", "yaw_replace", "yaw_replacement", "elodim_replace", "elodim_replacement", "nekudot", "nekudot_filter", "teamim", "versioning", "extended_gemara"]

function onInstall() {
  const basicPrefs = {"meforash_replace": false, "yaw_replace": false, "elodim_replace": false, "nekudot": true, "teamim": true, "versioning": true, "nekudot_filter": false, "extended_gemara": false};
  setPreferences(basicPrefs);
  //display release notes in popup
  
  let html = HtmlService.createHtmlOutputFromFile('release-notes')
      .setWidth(600)
      .setHeight(400);
  DocumentApp.getUi().showModalDialog(html, 'Release Notes');
}

let extendedGemaraPreference = false;

function onOpen() {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Insert Source', 'sefariaHTML')
      .addItem('Search Texts', 'sefariaSearch')
      .addItem('Preferences', 'preferencesPopup')
      .addItem('Support', 'supportAndFeatureRequestPopup')
      .addItem('Popcorn (beta)', 'popcornHTML')
      .addToUi();
}

function sefariaHTML() {
  onOpen();
  let mainHTMLOutput = HtmlService.createHtmlOutputFromFile('main').setTitle('Insert Source').setWidth(300);
  DocumentApp.getUi().showSidebar(mainHTMLOutput);
  extendedGemaraPreference = PropertiesService.getUserProperties().getProperty("extended_gemara");
}

function supportAndFeatureRequestPopup() {
  let html = HtmlService.createHtmlOutputFromFile('support-and-features')
      .setWidth(600)
      .setHeight(400);
  DocumentApp.getUi().showModalDialog(html, 'Support and Features');
}

function preferencesPopup() {
  let html = HtmlService.createHtmlOutputFromFile('preferences')
      .setWidth(600)
      .setHeight(400);
  DocumentApp.getUi().showModalDialog(html, 'Preferences');
}

//returns the user preference w.r.t. displaying the versioning dropdowns in the insertion module
function getVersioningPreference() {
  try {
    const userProperties = PropertiesService.getUserProperties(); 
    return userProperties.getProperty("versioning");
  } catch (error) {
    Logger.log(`The system has made a mach'ah: ${error.message}`);
    return true;
  }
}

function findReference(reference, versions=undefined) {
  //TODO - yes, this all works. But it would be nicer wrap all of this in a try-catch, or perhaps deal with it in another way, so it doesn't result in a runtime exception while the reference is incomplete (e.g. searching for "Shemo" yields no results until we get to "Shemot")
  //reference = "Shemot 12:1"; /* this is a test harness */
  Logger.log(`Reference: ${reference}`);
  let url = 'https://www.sefaria.org/api/texts/'
  
  if (versions) {
    let versionedAdditions = `${reference}?ven=${versions.en}&vhe=${versions.he}&commentary=0&context=0`;
    url = url + versionedAdditions;
  }
  else {
    let nonVersionedAdditions = `${reference}?commentary=0&context=0`;
    url = url + nonVersionedAdditions;
  }

  // patch for now; triggered when an invalid sefer name is sent
  try {
    let response = UrlFetchApp.fetch(url);
    let json = response.getContentText();
    let test_data = JSON.parse(json);
  
  /*although it might make more sense to put the filters (orthography, seamus) elsewhere, as it is text processing, 
  all representations of this data need to have these applied to them such that the preview is נאמן to what the actual
  ref will look like when inserted*/

  // also not such good form to put so much into a try block, but not something which is hard to understand / breaks the code so fine for now (TODO)

    const userProperties = PropertiesService.getUserProperties();
    // see https://unicode.org/charts/PDF/U0590.pdf for Hebrew unicode values
    if (userProperties.getProperty("nekudot") == "false" || (userProperties.getProperty("nekudot_filter") == "tanakh" || test_data.type != "Tanakh")) {
      json = json.replace(/[\u05B0-\u05BD]/g, "");
      json = json.replace(/[\u05BF-\u05C7]/g, ""); //in order to keep the makafs in
    }
    json = (userProperties.getProperty("teamim") == "false") ? json.replace(/[\u0591-\u05AF]/g, "") : json;
    // the following regexs are awful, but this seems to be the best way to match without regard for vocalizations/trope currently (TODO)
    let meforashReplacement = userProperties.getProperty("meforash_replacement");
    json = (userProperties.getProperty("meforash_replace") == "true") ? json.replace(/י[\u0591-\u05C7]*ה[\u0591-\u05C7]*ו[\u0591-\u05C7]*ה[\u0591-\u05C7]*/g, meforashReplacement) : json;  
    json = (userProperties.getProperty("yaw_replace") == "true") ? json.replace(/\bי[\u0591-\u05C7]*ה[\u0591-\u05C7]*\b/g, userProperties.getProperty("yaw_replacement")) : json;
    json = (userProperties.getProperty("elodim_replace") == "true") ? json.replace(/א[\u0591-\u05C7]*ל[\u0591-\u05C7]*ו[\u0591-\u05C7]*ה[\u0591-\u05C7]*י[\u0591-\u05C7]*ם[\u0591-\u05C7]*/g, userProperties.getProperty("elodim_replacement")) : json;
    
    let data = JSON.parse(json);   
    return data;

  } catch (error) {
    // return nothing
    Logger.log(`The system has made a macha'ah: ${error.message} from url ${url}`)
    return; 
  }

}

function testRef() {
  findReference("Shemot 12:2", {"en": "The Holy Scriptures: A New Translation (JPS 1917)", "he": "Yehoyesh's Yiddish Tanakh Translation [yi]"})
}

function formatDataForPesukim(data, pesukim) {

  let heTextWrapper = "", enTextWrapper = "", fromVerse = (data["sections"][1]) ? data["sections"][1] : 1;
  
  function addHebrewVerse(text, wrapper, pesukim, number) {
    let editedText = text;
    if(pesukim) {
        editedText = "("+gematriya(number, {punctuate: false})+") "+text+"\n";
    }
    wrapper+=editedText;
    return wrapper;
  }
  function addEnglishVerse(text, wrapper, pesukim, number) {
    let editedText = text;
      if(pesukim) {
        editedText = "("+number+") "+text+"\n";
      };
      wrapper+=editedText;
      return wrapper;
  }

  if(data.isSpanning) {
    data.he.forEach(function(perekText, perekNum) {
      if(typeof perekText == "object") {
        perekText.forEach(function(verseText, index) {
         heTextWrapper = addHebrewVerse(verseText, heTextWrapper, pesukim, fromVerse+index)
        });
        fromVerse = 1;
      } else {
        heTextWrapper+=perekText;
      }
    });
    data.text.forEach(function(perekText, perekNum) {
      if(typeof perekText == "object") {
        perekText.forEach(function(verseText, index) {
         enTextWrapper = addEnglishVerse(verseText, enTextWrapper, pesukim, fromVerse+index)
        });
        fromVerse = 1;
      } else {
        enTextWrapper+=perekText;
      }
    });
  } else {
    if(typeof data.he == "object") {
      data.he.forEach(function(ele, index) {
        heTextWrapper = addHebrewVerse(ele, heTextWrapper, pesukim, fromVerse+index);
      });
    } else {
      heTextWrapper = data.he;
    }
    if(typeof data.text == "object") {
      data.text.forEach(function(ele, index) {
        enTextWrapper = addEnglishVerse(ele, enTextWrapper, pesukim, fromVerse+index);
      });
    } else {
      enTextWrapper = data.text;
    }
  }

  data.he = heTextWrapper;
  data.text = enTextWrapper;

  return data;
};

function insertReference(data, singleLanguage = undefined, pasukPreference = true, preferredTitle = null) {
  //set title as preferred title (e.g. Bereishit instead of Genesis) if exists
  let title = (preferredTitle) ? preferredTitle : data.ref;

  //add pesukim if user wants
  data = formatDataForPesukim(data, pasukPreference);

  let doc = DocumentApp.getActiveDocument().getBody();
  let docWrapper = DocumentApp.getActiveDocument();
  let cursor = docWrapper.getCursor();
  let currentElement = cursor.getElement();
  let paragraphParent = currentElement.getParent();

  //convert 0-index to 1-index
  let index = paragraphParent.getChildIndex(currentElement) + 1;
  /* ---- test harness --- 
  let index = doc.getNumChildren()-1;
  */

  let headerStyle = {};
        headerStyle[DocumentApp.Attribute.BOLD] = true;
        headerStyle[DocumentApp.Attribute.UNDERLINE] = true;
  let nullStyle = {};
        nullStyle[DocumentApp.Attribute.BOLD] = false;
        nullStyle[DocumentApp.Attribute.UNDERLINE] = false;
  let noUnderline = {};
    noUnderline[DocumentApp.Attribute.UNDERLINE] = false;
  
  if (singleLanguage) {

    let ltr = (singleLanguage == "he") ? false : true;
    let titleText = (singleLanguage == "he") ? data.heRef : title;
    let mainText = (singleLanguage == "he") ? data.he : data.text;
    
    doc.insertParagraph(index, titleText)
      .setAttributes(headerStyle)
      .setLeftToRight(ltr);
    

    let mainTextParagraph = doc.insertParagraph(index+1, "");
    insertRichTextFromHTML(mainTextParagraph, mainText);
    mainTextParagraph.setAttributes(noUnderline);
    if (singleLanguage == "he") {
      mainTextParagraph.setAttributes(nullStyle);
    }
    mainTextParagraph.setLeftToRight(ltr);

  }
  else {
    /* note: since Hebrew text needs to be inserted in RTL order, we first insert the table without 
    the Hebrew text and then add in the Hebrew text manually, with the correct text-direction */
    let cells = [
      ["", ""],
      ["", ""]
    ];
    let tableStyle = {};
        tableStyle[DocumentApp.Attribute.BOLD] = false;
    let table = doc.insertTable(index, cells)

    table.setAttributes(tableStyle);

    let engTitle = table.getCell(0, 0)
      .setText("")
      .insertParagraph(0, "");
    engTitle.setLeftToRight(true);
    insertRichTextFromHTML(engTitle, title);
    engTitle.setAttributes(headerStyle);

    let hebTitle = table.getCell(0, 1)
      .setText("")
      .insertParagraph(0, "");
    hebTitle.setLeftToRight(false);
    insertRichTextFromHTML(hebTitle, data.heRef);
    hebTitle.setAttributes(headerStyle);

    let engText = table.getCell(1, 0)
      .setText("")
      .insertParagraph(0, "")
      .setLeftToRight(true);
    engText.setAttributes(nullStyle);
    insertRichTextFromHTML(engText, data.text);
    engText.setAttributes(noUnderline);

    let hebText = table.getCell(1, 1)
      .setText("")
      .insertParagraph(0, "");
    hebText.setLeftToRight(false);
    hebText.setAttributes(nullStyle);
    insertRichTextFromHTML(hebText, data.he);
    hebText.setAttributes(noUnderline);

    /* the constraints of insertParagraph mean that there will always be an extra line break in table cells to which we dynamically add text. See https://stackoverflow.com/questions/39506414/remove-newline-from-google-doc-table-content.
    This solution was contributed by an expert in Google Apps Script, @tanaike. Thanks @tanaike! [https://stackoverflow.com/questions/76647915/extra-spaces-when-inserting-text-in-google-docs-tables-rich-text-version?noredirect=1#comment135153775_76647915] */ 

    for (let r = 0; r < table.getNumRows(); r++) {
      const row = table.getRow(r);
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        const n = cell.getNumChildren();
        cell.getChild(n - 1).removeFromParent();
      }
    }

  }

}

/*
converts an html string (returned from the Sefaria API) to rich-text (using the Google Docs API) and inserts it into the provided element.
violates encapsulation principles because Google Apps Script for some reason doesn't allow for headless rich text (e.g. new Text()...)
*/
function insertRichTextFromHTML(element, htmlString) {
  // for economy's sake, the stripping of Davidson talmud (if preference is for translation without explanation) is done here, since we are already going through the tags. But this isn't the best design choice מבחינת the architectonics of the code. TODO

  element = element.editAsText();
  let buf = [];
  let index = 0, italicsFnCount = 0, textLength = element.editAsText().getText().length;
  let bolded = false, italicized = false, inFootnote = false;


  if (Array.isArray(htmlString)) {
    htmlString = htmlString.join("");
  }
  let iterableString = htmlString.split(/(<\/?[a-zA-Z]+[a-zA-Z'"0-9= \-/]*>)/g);

  let inserterFn = (textModification) => {
    //grab all words in the buffer and join
    let snippet = buf.join("");

    //index of snippet needs to be zero-indexed. This is how we keep track of which words/phrases/sentences to bold/italicize
    let snippetLength = snippet.length;
    let snippetIndex = snippetLength - 1;

    if (snippet != "") {
      element.insertText(textLength, snippet);

      //set rich text settings
      element.setBold(textLength, textLength+snippetIndex, bolded); 
      element.setItalic(textLength, textLength+snippetIndex, italicized);

      textLength += snippetLength;
    }

    switch(textModification) {
      case "bold":
        bolded = !bolded;
        break;
      case "italic":
        italicized = !italicized;
        break;
      case "linebreak":
        element.insertText(textLength, "\n");
        textLength += 1;
        break;
    }
  }

  for (let i = 0; i < iterableString.length; i++) {
    let word = iterableString[i];

    /* example format of footnotes in the text: -----‘Do not let me see your faces<sup class=\"footnote-marker\">*</sup><i class=\"footnote\"><b>Do not let me see your faces </b>See note at v. 3.</i> unless----*/
    if (inFootnote) {
      if ( word == "<i class=\"footnote\">" || word == "<i>") {
        italicsFnCount++;
      } else if ( word == "</i>") {
        italicsFnCount--;
        if (italicsFnCount == 0) {
          inFootnote = false;
          continue;
        }
      }

    }

    else if (word[0] == "<") {
      //grab the name of the tag
      let tagName = /<\/?([a-zA-Z]+)([a-zA-Z'"0-9= \-/])*>/.exec(word)[1];

      switch (tagName) {
        case "b":
          inserterFn("bold");
          buf = [];
          index = 0;
          break;
        case "strong":
          if (!extendedGemaraPreference || bolded) {
            inserterFn("bold");
          }
          buf = [];
          index = 0;
          break;
        case "i":
          if (!extendedGemaraPreference || bolded) {
            inserterFn("italic");
          }
          buf = [];
          index = 0;
          break;
        case "br":
          inserterFn("linebreak");
          buf = [];
          index = 0;
          break;
        case "sup":
          inFootnote = true;
          italicsFnCount = 0;
          break;
        default:
          break;
      }
      continue;
    }

    if (!inFootnote) {
      buf[index++] = word;
    }
  }

  // add in the last words, if the text snippet does not end with a tag
  let snippet = buf.join("");
  if ( snippet != "" ) {
    element.insertText(textLength, snippet);
    let snippetIndex = snippet.length - 1;
    element.setBold(textLength, textLength+snippetIndex, false); 
    element.setItalic(textLength, textLength+snippetIndex, false);
  }
}

function getPreferences() {
  let returnPrefs = {}
  let preferences = PropertiesService.getUserProperties();
  for (let i = 0; i < SETTINGS.length; i++) {
    returnPrefs[SETTINGS[i]] = preferences.getProperty(SETTINGS[i]);
  }
  return returnPrefs;
}

function setPreferences(preferenceObject) {
  const userProperties = PropertiesService.getUserProperties();  
  for (const property in preferenceObject) {
    try {

      userProperties.setProperty(property, preferenceObject[property]);


    } catch (error) {

      Logger.log(`The system has made a mach'ah: ${error.message}`);
    }
  }
}

function sefariaSearch() {
  extendedGemaraPreference = PropertiesService.getUserProperties().getProperty("extended_gemara");
  let searchGetHtml = HtmlService.createHtmlOutputFromFile('search')
      .setTitle('Search All Texts')
      .setWidth(300);
  DocumentApp.getUi() 
      .showSidebar(searchGetHtml);
} 

function returnTitles() {
    let url = 'https://www.sefaria.org/api/index/titles/';
    let response = UrlFetchApp.fetch(url);
    let json = response.getContentText();
    let data = JSON.parse(json);
    let titleArray = data["books"];
    return titleArray;
}

function findSearch(input, filters, pageRank) {

   let url = 'https://www.sefaria.org/api/search-wrapper';

   //h/t to Russell Neiss for the filters demo code

   let filter_fields = Array(filters.length).fill("path");

   let searchOptions = {
    'aggs': [],
    'field': 'naive_lemmatizer',
    'filters': filters,
    'filter_fields': filter_fields,
    'query': input,
    'size': 50,
    'slop': 10,
    'type': 'text',
    'source_proj': true
  };

  if (pageRank) {
    let pageRankOptions = {'sort_fields': [
      'pagesheetrank'
      ],
      'sort_method': 'score',
      'sort_reverse': false,
      'sort_score_missing': 0.04,
    }
    searchOptions = {
      ...searchOptions,
      ...pageRankOptions
    }
  }

  let dataToSend = JSON.stringify(searchOptions);
  let postOptions = { "method":"post",
    "payload" : dataToSend  
  };
  let response = UrlFetchApp.fetch(url, postOptions).getContentText();

  let responseJSON = JSON.parse(response);
  
  return responseJSON["hits"]["hits"];
}

function popcornHTML() {
  let mainHTMLOutput = HtmlService.createHtmlOutputFromFile('popcorn').setTitle('Popcorn (beta)').setWidth(300);
  DocumentApp.getUi().showSidebar(mainHTMLOutput);
}

function insertPopcorn() {
  // hardcoded in consts file since we don't have that many tokens per day for querying the api, unfortunately
  
  let selectSource = (book, isShas) => {
    // currently only will give daf alef of shas, but that's fine for now because this is shtick anyways
    let ref = "", section = "", folio = "";
    if (isShas) {
      section = Math.floor(book["length"] * Math.random()) + 2;
      folio = ["a", "b"][Math.floor(Math.random() * 2)];
      ref = `${book["title"]}.${section}${folio}`;
    } else {
      section = Math.floor(book["length"] * Math.random());
      ref = `${book["title"]}.${section}`;
    }
    
    let data = findReference(ref);
    
    // ugly, but easier to fudge the title from scratch rather than get it dynamically and be forced to make yet ANOTHER req to the api

    let amtOfVerses = data.text.length;
    let randomVerseNumber = Math.floor(Math.random() * amtOfVerses);

    
    data.text = data.text[randomVerseNumber];
    //temporary fix
    data.he = data.he[randomVerseNumber++]

    data.heRef = `${data.heTitle} ${gematriya(section, {punctuate: false})}:${gematriya(randomVerseNumber, {punctuate: false})}`;
    //ugly fix
    data.ref = `${ref.replace(/\./g, " ")}:${randomVerseNumber}`;

    insertReference(data);

  };
  let i = 0;
  const AMT_OF_POPCORN = 5;
  while  (i < AMT_OF_POPCORN) {
    try {
      let typeOfBook = Math.floor(Math.random() * 2);
      let bookList = indexForPopcorn[typeOfBook];
      let bookIndex = Math.floor(bookList.length * Math.random());
      let book = bookList[bookIndex];

      const isShas = (typeOfBook == 0) ? false : true;
      
      selectSource(book, isShas);
      i++;
    } catch(e) {
      Logger.log(`Could not pop the following kernel because ${e.message}`);
    }

  }
}

/*
 * Convert numbers to gematriya representation, and vice-versa.
 *
 * Licensed MIT.
 *
 * Copyright (c) 2014 Eyal Schachter [and updated to conform to modern ES6 conventions (well, somewhat) by Shlomi Helfgot]
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

	const letters = {}, numbers = {
		'': 0,
		א: 1,
		ב: 2,
		ג: 3,
		ד: 4,
		ה: 5,
		ו: 6,
		ז: 7,
		ח: 8,
		ט: 9,
		י: 10,
		כ: 20,
		ל: 30,
		מ: 40,
		נ: 50,
		ס: 60,
		ע: 70,
		פ: 80,
		צ: 90,
		ק: 100,
		ר: 200,
		ש: 300,
		ת: 400,
		תק: 500,
		תר: 600,
		תש: 700,
		תת: 800,
		תתק: 900,
		תתר: 1000
	};
  let i;
	for (i in numbers) {
		letters[numbers[i]] = i;
	}

	function gematriya(num, options) {
		if (options === undefined) {
			let options = {limit: false, punctuate: true, order: false, geresh: true};
		}

		if (typeof num !== 'number' && typeof num !== 'string') {
			throw new TypeError('non-number or string given to gematriya()');
		}

		if (typeof options !== 'object' || options === null){
			throw new TypeError('An object was not given as second argument')
		}

		let limit = options.limit;
		let order = options.order;
		let punctuate = typeof options.punctuate === 'undefined' ? true : options.punctuate;
		let geresh = typeof options.geresh === 'undefined' && punctuate ? true : options.geresh;

		let str = typeof num === 'string';

		if (str) {
			num = num.replace(/('|")/g,'');
		}
		num = num.toString().split('').reverse();
		if (!str && limit) {
			num = num.slice(0, limit);
		}

		num = num.map(function g(n,i){
			if (str) {
				return order && numbers[n] < numbers[num[i - 1]] && numbers[n] < 100 ? numbers[n] * 1000 : numbers[n];
			} else {
				if (parseInt(n, 10) * Math.pow(10, i) > 1000) {
					return g(n, i-3);
				}
				return letters[parseInt(n, 10) * Math.pow(10, i)];
			}
		});

		if (str) {
			return num.reduce(function(o,t){
				return o + t;
			}, 0);
		} else {
			num = num.reverse().join('').replace(/יה/g,'טו').replace(/יו/g,'טז').split('');

			if (punctuate || geresh)	{
				if (num.length === 1) {
					num.push(geresh ? '׳' : "'");
				} else if (num.length > 1) {
					num.splice(-1, 0, geresh ? '״' : '"');
				}
			}

			return num.join('');
		}
	}