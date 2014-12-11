function onInstall() {
  onOpen();
}
function onOpen() {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Sefaria Library', 'sefariaHTML')
      .addItem('Search Sefaria', 'sefariaSearch')
      .addItem('About', 'aboutDialog')
      .addToUi();
}
function aboutDialog() {

}
function sefariaHTML() {
 var sefGetHtml = HtmlService.createHtmlOutputFromFile('mainsef')
          .setTitle('Insert a text from the Sefaria Library')
          .setWidth(300);
      DocumentApp.getUi() 
          .showSidebar(sefGetHtml);
}
function findRef(ref, insert) {
    if(ref == "") {
       return;
    }
    else {
       var textSearchOr = ref;
    }
    var url = 'http://www.sefaria.org/api/texts/'
        +ref+"?commentary=0&context=0";
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    var data = JSON.parse(json);
          if(data["sections"].length > 1) {
              var pasukNum = data["sections"][1];
          }
          else {
              var pasukNum = 1;
          }
          var emendedTextEn = "";
          var emendedTextHe = "";
          var compLength = (typeof data.he === "string") ? 1 : data.he.length;
          for(var j = 0; j<compLength; j++) {
            if(typeof data.he === "object") {
              var jUrl = "http://hebrew.jdotjdot.com/encode?input="+parseInt(parseInt(j)+parseInt(pasukNum));
              var numResponse = UrlFetchApp.fetch(jUrl);
              var jdotNum = numResponse.getContentText();
              data.text[j] = "("+(j+parseInt(pasukNum))+")"+data.text[j]+"\r"; //add pasuk number
              data.he[j] = "("+jdotNum+")"+data.he[j]+"\n";
              emendedTextEn+= data.text[j];
              emendedTextHe+=data.he[j];
            }
            else if(typeof data.he === "string" && typeof data.he !== "undefined") {
              var jUrl = "http://hebrew.jdotjdot.com/encode?input="+parseInt(parseInt(j)+parseInt(pasukNum));
              var numResponse = UrlFetchApp.fetch(jUrl);
              var jdotNum = numResponse.getContentText();
              data.text = "("+(j+parseInt(pasukNum))+")"+data.text+"\r"; //add pasuk number
              data.he = "("+jdotNum+")"+data.he+"\n";
              emendedTextEn+= data.text;
              emendedTextHe+=data.he;
            }
           };
           data.text = emendedTextEn;
           data.he = emendedTextHe;
           emendedTextEn.replace(/(<(\D)>)([^<>]+)(<\/(\D)>)/g, "$3");
           emendedTextHe.replace(/(<(\D)>)([^<>]+)(<\/(\D)>)/g, "$3");
           var numjUrl = "http://hebrew.jdotjdot.com/encode?input="+data.sections[0];
           var numnumResponse = UrlFetchApp.fetch(numjUrl);
           var perekNumero = numnumResponse.getContentText();
           data.heTitle = data.heTitle +" "+ perekNumero;
           if(insert) {
              insertRef(data, textSearchOr);
           }
           else {
              return data;
           }
}
function insertRef(data, title) {
           var cells = [
           [title, data.heTitle /*add perek num*/],
           [data.text, ""]
           ];
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.TIMES_NEW_ROMAN;
               tableStyle[DocumentApp.Attribute.FONT_SIZE] =
                12;
           var doc = DocumentApp.getActiveDocument().getBody();
           doc.appendTable(cells).setAttributes(tableStyle).getCell(1,1).insertParagraph(0, "").setLeftToRight(false).appendText(data.he);
}
function sefariaSearch() {
       var searchGetHtml = HtmlService.createHtmlOutputFromFile('searchpane')
          .setTitle('Search Sefaria')
          .setWidth(300);
      DocumentApp.getUi() 
          .showSidebar(searchGetHtml);
} 
function returnTitles() {
    var turl = 'http://www.sefaria.org/api/index/titles/';
    var tresponse = UrlFetchApp.fetch(turl);
    var tjson = tresponse.getContentText();
    var tdata = JSON.parse(tjson);
    var titleArray = tdata["books"];
    return titleArray;
}
function parshaIn(aliyah) {
    if(aliyah == 7) {
       return;
    }
    var purl = 'http://www.sefaria.org/api/texts/parashat_hashavua';
    var presponse = UrlFetchApp.fetch(purl);
    var pjson = presponse.getContentText();
    var pdata = JSON.parse(pjson);
     findRef(pdata.aliyot[aliyah], true);
}
function findSearch(inp) {
    inp = inp || "לעולם";
    var retdata = [];
    var surl = 'http://search.sefaria.org:9200/sefaria/_search?q='+inp+'&size=100';
    var sresponse = UrlFetchApp.fetch(surl);
    var sjson = sresponse.getContentText();
    var sdata = JSON.parse(sjson);
  for(var n = 0; n<24; n++) {
     retdata.push(sdata["hits"]["hits"][n]);
  }
   // Logger.log(retdata);
    return retdata;
  }

          ///                                         //        \
        //////                                      \     \\\\\  \\\
      ///****//                                      \         \    \
    ////*///////                                      \     \   \    \          
     //****///          
      //////
       ///
