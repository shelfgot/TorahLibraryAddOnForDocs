function onInstall() {
  onOpen();
}

function onOpen() {
  // Add a menu with some items, some separators, and a sub-menu.
  DocumentApp.getUi().createMenu('Sefaria Library')
      .addItem('Search Sefaria', 'sefariaGet')
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
      var perek = true;
      var pasuk = false;
      var result = DocumentApp.getUi().prompt('Search for texts',
      'Enter the name of the Jewish text you\'re looking for:', DocumentApp.getUi().ButtonSet.OK_CANCEL);
 
  //TODO: add suport for enter-as-click
  if (result.getSelectedButton() == DocumentApp.getUi().Button.OK) {
    
    var textSearch = result.getResponseText();
    textSearch = textSearch.split(" ");
    //TODO: add support for snippets of text/Gemara
    var url = 'http://www.sefaria.org/api/texts/'
        +textSearch[0].charAt(0).toUpperCase() + textSearch[0].slice(1); //Capitalization
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
                 var enEmend = "";
                 var heEmend = "";
                 var psukimRef = (pasukRef.split("-"));
                 for (var i = psukimRef[0]-1; i<psukimRef[1]-1; i++) {
                      enEmend+=data.text[i];
                      heEmend+=data.he[i];
                      }
                 data.text= enEmend;
                 data.he = heEmend; 
               }
               else {
                 data.text= data.text[pasukRef-1];
                 data.he = data.he[pasukRef-1];
               }
        
           }
        
           var cells = [
           [textSearch[0]+" "+textSearch[1], data.heTitle],
           [data.text, data.he]
           ];
       
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.TIMES_NEW_ROMAN;
               tableStyle[DocumentApp.Attribute.FONT_SIZE] =
                12;
           var doc = DocumentApp.getActiveDocument().getBody();
           doc.appendTable(cells).setAttributes(tableStyle);
    } 
  }
}
