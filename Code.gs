function onInstall() {
  onOpen();
}
function onOpen() {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Insert Source', 'sefariaHTML')
      .addItem('Search Texts', 'sefariaSearch')
      .addToUi();
}

function sefariaHTML() {
 var sefGetHtml = HtmlService.createHtmlOutputFromFile('mainsef')
 .setTitle('Insert Source')
          .setWidth(300);
      DocumentApp.getUi() 
          .showSidebar(sefGetHtml);
}
function findReference(reference) {
  var url = 'http://www.sefaria.org/api/texts/'+reference+'?commentary=0&context=0';
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);  
  return data;
}

function stringifyData(data, pesukim) {
  var heTextWrapper = "", enTextWrapper = "", fromVerse = data["sections"][1];
  
  function addHebrewVerse(text, wrapper, pesukim, number) {
    var editedText = text;
    if(pesukim) {
        editedText = "("+gematriya(number, {punctuate: false})+") "+text+"\n";
    }
    wrapper+=editedText;
    return wrapper;
  }
  function addEnglishVerse(text, wrapper, pesukim, number) {
    var editedText = text;
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

function insertReference(data, singleLanguage, iWantPesukim) {
  data = stringifyData(data, iWantPesukim);
  var lang = singleLanguage;
  var title = data.ref;
  var doc = DocumentApp.getActiveDocument().getBody();
           var upDoc = DocumentApp.getActiveDocument();
           var cursor = upDoc.getCursor();

           var element = cursor.getElement();
           var parent = element.getParent();

           var index = parent.getChildIndex(element) + 1;
           data.text = data.text.replace(/<[0-9a-zA-z \/\u0590-\u05FF '"=-♦]+>/g, "");
           data.he = data.he.replace(/<[0-9a-zA-z \/\u0590-\u05FF '"=-♦]+>/g, ""); //stopgap solution for now.
  if(lang) {
    var tex;
    var titleText, cursor, titlep, para, pos;
    var nullStyle = {};
        nullStyle[DocumentApp.Attribute.BOLD] = false;
        nullStyle[DocumentApp.Attribute.UNDERLINE] = false;
    var headerStyle = {};
        headerStyle[DocumentApp.Attribute.BOLD] = true;
        headerStyle[DocumentApp.Attribute.UNDERLINE] = true;
    if(lang=="he") {
      tex = data.he;
      titleText = data.heRef;
      titlep =  doc.insertParagraph(index, titleText).setAttributes(headerStyle).setLeftToRight(false);
      para =  doc.insertParagraph(index+1, tex).setAttributes(nullStyle).setLeftToRight(false);
      upDoc.setCursor(DocumentApp.getActiveDocument().getCursor().getOffset()+2);
    }
    else {
      tex = data.text;
      titleText = title;
      cursor = DocumentApp.getActiveDocument().getCursor();
      titlep = doc.insertParagraph(index, titleText).setAttributes(headerStyle).setLeftToRight(true);
      para = doc.insertParagraph(index+1, tex).setAttributes(nullStyle).setLeftToRight(true);
      pos = upDoc.newPosition(index, index+2)
      upDoc.setCursor(pos);
    }
  }
  else {
           var cells = [
              [title, data.heRef],
              [data.text, ""]
           ];
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.BOLD] = false;
           doc.insertTable(index, cells).setAttributes(tableStyle).getCell(1,1).insertParagraph(0, "").setLeftToRight(false).appendText(data.he);
  }
}

function sefariaSearch() {
       var searchGetHtml = HtmlService.createHtmlOutputFromFile('searchpane')
          .setTitle('Search All Texts')
          .setWidth(300);
      DocumentApp.getUi() 
          .showSidebar(searchGetHtml);
} 
function returnTitles() {
    var url = 'https://www.sefaria.org/api/index/titles/';
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
    var titleArray = data["books"];
    return titleArray;
}

function findSearch(input, filters) {
   var url = 'https://www.sefaria.org/api/search/text/_search';
   var data = {
   "size":100,
   "highlight":{
      "pre_tags":[
         "<b>"
      ],
      "post_tags":[
         "</b>"
      ],
      "fields":{
         "naive_lemmatizer":{
            "fragment_size":200
         }
      }
   },
   "sort":[
      {
         "comp_date":{

         }
      },
      {
         "order":{

         }
      }
   ],
   "query":{
     "function_score":{
         "field_value_factor":{
            "field":"pagesheetrank",  // sort using pre calculated pagesheetrank values
            "missing":0.04
         },
         "query": {
              "bool":{
                  "must":{
                      "match_phrase":{
                            "naive_lemmatizer":{  //querying the naive_lemmatizer field
                            "query":input,
                            "slop":5  // maximum distance between terms, in words
                          }
                        }
                  },
                  "filter":{
                      "bool":{
                        "should":[  // include a list of regular expressions that should be matched. In this case, we specify a regex on the `path` field
                            {
                              "regexp":{
                                  "path": filters+".*"
                              }
                            }
                        ]
                      }
                    }
               }
     
             }
          }
   }
   }

  var dataToSend = JSON.stringify(data);
  var options = { "method":"post",
    "payload" : dataToSend
  };
  var response = UrlFetchApp.fetch(url, options).getContentText();

  var responseJSON = JSON.parse(response);
  var searchResults = [];
      
  for(var i = 0; i<responseJSON["hits"]["hits"].length; i++) {
    searchResults.push(responseJSON["hits"]["hits"][i]);
  }
   
  return searchResults;
}

function openSettings() {
  var html = HtmlService.createHtmlOutputFromFile('settings.html')
      .setWidth(400)
      .setHeight(300);
  DocumentApp.getUi().showModalDialog(html, 'Settings');
}


/*
 * Convert numbers to gematriya representation, and vice-versa.
 *
 * Licensed MIT.
 *
 * Copyright (c) 2014 Eyal Schachter
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

	var letters = {}, numbers = {
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
	}, i;
	for (i in numbers) {
		letters[numbers[i]] = i;
	}

	function gematriya(num, options) {
		if (options === undefined) {
			var options = {limit: false, punctuate: true, order: false, geresh: true};
		}

		if (typeof num !== 'number' && typeof num !== 'string') {
			throw new TypeError('non-number or string given to gematriya()');
		}

		if (typeof options !== 'object' || options === null){
			throw new TypeError('An object was not given as second argument')
		}

		var limit = options.limit;
		var order = options.order;
		var punctuate = typeof options.punctuate === 'undefined' ? true : options.punctuate;
		var geresh = typeof options.geresh === 'undefined' && punctuate ? true : options.geresh;

		var str = typeof num === 'string';

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
