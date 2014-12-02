function onInstall() {
  onOpen();
}
function onOpen() {
  // Add a menu with some items, some separators, and a sub-menu.
  DocumentApp.getUi().createAddonMenu()
      .addItem('Sefaria Library', 'sefariaHTML')
      .addItem('Search Sefaria', 'sefariaSearch')
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

}
function sefariaHTML() {
 var sefGetHtml = HtmlService.createHtmlOutputFromFile('mainsef')
          .setWidth(300)
          .setHeight(500);
      DocumentApp.getUi() 
          .showModalDialog(sefGetHtml, 'Insert a text from the Sefaria Library');
}
function findRef(textSearch) {
    var textSearchOr = textSearch;
    textSearch.replace(/( )(\D)/, "_$2");
    var textSearchSplit = textSearch.split(" ");
    textSearch.replace(/( )(\d)/, ".$2");
      var url = 'http://www.sefaria.org/api/texts/'
        +textSearch;
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
      if(data.he != undefined) {
           if (/\:/.test(textSearchSplit[1])) {
               // string has perek/pasuk
               var pasukRef = (textSearchSplit[1].split(":"))[1];
             if (/\-/.test(pasukRef)) { 
                 // string has "-" (not one pasuk, but many psukim)
                 var enEmend = [];
                 var heEmend = [];
                 var psukimRef = (pasukRef.split("-"));
                 for (var i = psukimRef[0]-1; i<psukimRef[1]; i++) {
                      enEmend.push(data.text[i]);
                      heEmend.push(data.he[i]);
                      }
                 var pasukNum = psukimRef[0];
                 data.text= enEmend;
                 data.he = heEmend; 
               }
             else {
               var enPasuk = "", hePasuk= "";
               enPasuk= data.text[pasukRef-1];
               data.text= new Array(1);
               data.text[0] = enPasuk;
               hePasuk = data.he[pasukRef-1];
               data.he= new Array(1); 
               data.he[0] = hePasuk;
               var pasukNum = pasukRef;
             }
           var emendedTextEn = "", emendedTextHe = "";
           }
           else {
           var pasukNum = 1;
           var emendedTextEn = "", emendedTextHe = "";
           }
          for(var j = 0; j<data.text.length; j++) {
              data.text[j] = "("+(j+parseInt(pasukNum))+")"+data.text[j]+"\r"; //add pasuk number
              var jUrl = "http://hebrew.jdotjdot.com/encode?input="+parseInt(parseInt(j)+parseInt(pasukNum));
              var numResponse = UrlFetchApp.fetch(jUrl);
              var jdotNum = numResponse.getContentText();
              data.he[j] = "("+jdotNum+")"+data.he[j]+"\n";
              emendedTextEn+= data.text[j];
              emendedTextHe = emendedTextHe + data.he[j];
           };
           // emendedTextEn.replace(/(<(\D)>)([^<>])+(<\/(\D)>)/g, ""); //Strip html tags
           var numjUrl = "http://hebrew.jdotjdot.com/encode?input="+data.sections[0];
           var numnumResponse = UrlFetchApp.fetch(numjUrl);
           var perekNumero = numnumResponse.getContentText();
           data.heTitle = data.heTitle +" "+ perekNumero;
           
           var cells = [
           [textSearchOr, data.heTitle /*add perek num*/],
           [emendedTextEn, ""]
           ];
       
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.TIMES_NEW_ROMAN;
               tableStyle[DocumentApp.Attribute.FONT_SIZE] =
                12;
           var doc = DocumentApp.getActiveDocument().getBody();
           doc.appendTable(cells).setAttributes(tableStyle).getCell(1,1).insertParagraph(0, "").setLeftToRight(false).appendText(emendedTextHe);
    }
    else {
        DocumentApp.getUi().alert("Sefer or Perek not found.");
        sefariaGet();
    }
  }
function sefariaSearch() {
      var result = DocumentApp.getUi().prompt('Search Sefaria',
                                              'Enter phrase:', DocumentApp.getUi().ButtonSet.OK_CANCEL);
       if (result.getSelectedButton() == DocumentApp.getUi().Button.OK) {
          var textSearch = result.getResponseText();
          var searchUrl = 'http://search.sefaria.org:9200/sefaria/_search?q='
          +textSearch;
          var searchResponse = UrlFetchApp.fetch(searchUrl);
          var searchJson = searchResponse.getContentText();
          var searchData = JSON.parse(searchJson);
          DocumentApp.getUi().alert(searchData["hits"]["total"]+" hits.");
        
         searchData["hits"]["hits"].forEach(function(m) {
            findRef(m["_source"]["ref"]);
         });}
} 
          ///                                         //        \
        //////                                      \     \\\\\  \\\
      ///****//                                      \         \    \
    ////*///////                                      \     \   \    \          
     //****///          
      //////
       ///
