function onInstall() {
  onOpen();
}

function onOpen() {
  // Add a menu with some items, some separators, and a sub-menu.
  DocumentApp.getUi().createMenu('Sefaria Library')
      .addItem('Sefaria Library', 'sefariaGet')
      .addItem('Search Sefaria', 'sefariaSearch')
      .addItem('Transliteration Guidelines', 'showGuide')
      .addItem('About', 'aboutDialog')
      .addToUi();
}
function showGuide() {
      var html = HtmlService.createHtmlOutputFromFile('transguide')
          .setWidth(700)
          .setHeight(400);
      DocumentApp.getUi() 
          .showModalDialog(html, 'Sefaria Transliteration Guidelines');

}
function aboutDialog() {

  //TODO
}

function sefariaGet() {
      var result = DocumentApp.getUi().prompt('Search for texts',
      'Enter the name of the Jewish text you\'re looking for:', DocumentApp.getUi().ButtonSet.OK_CANCEL);
 
  //TODO: add suport for enter-as-click
  if (result.getSelectedButton() == DocumentApp.getUi().Button.OK) {
    
    var textSearch = result.getResponseText();
    textSearch = textSearch.split(" ");
    //TODO: add support for snippets of text/Gemara
    var url = 'http://www.sefaria.org/api/texts/'
        +textSearch[0]//automatic capitalization: thanks sefaria
        +'.'
        +textSearch[1];
    
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
      if(data.he != undefined) {
           //TODO get rid of b, i, u pre-html sefaria tags
           //TODO: make it fancy
           if (/\:/.test(textSearch[1])) {
               // string has perek/pasuk
               var pasukRef = (textSearch[1].split(":"))[1];
             if (/\-/.test(pasukRef)) { 
                 // string has - (not one pasuk, but many psukim)
                 var enEmend = [];
                 var heEmend = [];
                 var psukimRef = (pasukRef.split("-"));
                 for (var i = psukimRef[0]-1; i<psukimRef[1]; i++) {
                      enEmend.push(data.text[i]);
                      heEmend.push(data.he[i]);
                      }
                 data.text= enEmend;
                 data.he = heEmend; 
               }
             else {
               enPasuk = "", hePasuk= "";
               enPasuk= data.text[pasukRef-1];
               data.text= new Array(1);
               data.text[0] = enPasuk;
               hePasuk = data.he[pasukRef-1];
               data.he= new Array(1);
               data.he[0] = hePasuk;
             }
           var emendedTextEn = "", emendedTextHe = "";
           }
           for(var j = 0; j<data.text.length; j++) {
              data.text[j]+="\n"; //add new tab
              data.text[j] = "("+(j+parseInt(pasukRef))+")"+data.text[j]; //add pasuk number
              /*var numResponse = UrlFetchApp.fetch("http://hebrew.jdotjdot.com/encode?input="+j);
               var numData = numResponse.getContentText();
               var numJson = JSON.parse(numData);
               Logger.log(numJson);*/
               var jdotNum= ""; //?//;
               
             
              
              data.he[j]+="\n"; //add tab;
              data.he[j] = "("+jdotNum+")"+data.he[j];
              emendedTextEn+= data.text[j];
              emendedTextHe+= data.he[j];
           };
           var cells = [
           [textSearch[0]+" "+textSearch[1], data.heTitle],
           [emendedTextEn, emendedTextHe]
           ];
       
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.TIMES_NEW_ROMAN;
               tableStyle[DocumentApp.Attribute.FONT_SIZE] =
                12;
           var doc = DocumentApp.getActiveDocument().getBody();
           doc.appendTable(cells).setAttributes(tableStyle);
    }
    else {
          DocumentApp.getUi().alert("Sefer or Perek not found.");
          sefariaGet();
    }
  }
}
function sefariaSearch() {
      var result = DocumentApp.getUi().prompt('Search Sefaria',
                                              'Enter phrase:', DocumentApp.getUi().ButtonSet.OK_CANCEL);
 
       //TODO: add suport for enter-as-click
       if (result.getSelectedButton() == DocumentApp.getUi().Button.OK) {
          var textSearch = result.getResponseText();
          //TODO: add support for snippets of text/Gemara
          var searchUrl = 'http://search.sefaria.org:9200/sefaria/_search?q='
          +textSearch;
          var searchResponse = UrlFetchApp.fetch(searchUrl);
          var searchJson = searchResponse.getContentText();
          var searchData = JSON.parse(searchJson);
          DocumentApp.getUi().alert(searchData["hits"]["total"]+" hits.");
          //searchData["hits"]["hits"][0]["_id"]
       }
} 
          ///                                                     
        //////                    
      ///****//                  
    ////*///////                 
     //****///          
      //////
       ///
