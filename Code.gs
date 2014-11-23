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

}

function sefariaGet() {
      
      var result = DocumentApp.getUi().prompt('Search for texts',
      'Enter the name of the Jewish text you\'re looking for:', DocumentApp.getUi().ButtonSet.OK_CANCEL);
 
  
  if (result.getSelectedButton() == DocumentApp.getUi().Button.OK) {
    
    var textSearch = result.getResponseText();
    textSearch = textSearch.split(" ");
   
    var url = 'http://www.sefaria.org/api/texts/'
        +textSearch[0].charAt(0).toUpperCase() + textSearch[0].slice(1); //Capitalization
        +'.'
        +textSearch[1];
    
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
      if(data.he != undefined) {
        
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
