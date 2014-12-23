function onInstall() {
  onOpen();
}
function onOpen() {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Insert Source', 'sefariaHTML')
      .addItem('Search Texts', 'sefariaSearch')
  .addItem('Cite Sources','bibMaker')
      .addToUi();
}
function sefariaHTML() {
 var sefGetHtml = HtmlService.createHtmlOutputFromFile('mainsef')
 .setTitle('Insert Source')
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
    var pasukNum;
      if(data["sections"][1]) {
              pasukNum = data["sections"][1];
      }
     else {
        pasukNum = 1;
     }
          var emendedTextEn = "";
          var emendedTextHe = "";
          var compLength = (typeof data.he === "string") ? 1 : data.he.length;
          for(var j = 0; j<compLength; j++) {
            if(typeof data.he === "object") {
              var jUrl = "http://hebrew.jdotjdot.com/encode?input="+parseInt(parseInt(j)+parseInt(pasukNum));
              var numResponse = UrlFetchApp.fetch(jUrl);
              var jdotNum = numResponse.getContentText();
              if(typeof data.he[j] === "undefined") {
                 data.he.push("לא מצאנו פסוק זה בעברית");
              }
              if(typeof data.text[j] === "undefined") {
                 data.text.push("No English text found for this pasuk.");
              }
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
           var perekNumero;
               if(data["sectionNames"][0] == "Daf") {
                  perekNumero = "";
               }
               else {
                 var numjUrl = "http://hebrew.jdotjdot.com/encode?input="+data.sections[0];
                 var numnumResponse = UrlFetchApp.fetch(numjUrl);
                 perekNumero = numnumResponse.getContentText();
               }
           data.heTitle = data.heTitle +" "+ perekNumero;
           if(insert) {
              insertRef(data, textSearchOr);
           }
           else {
              return data;
           }
}
function insertRef(data, title) {
           data.text = data.text.replace(/(<(\D)>)([^<>]+)(<\/(\D)>)/g, "$3");
           data.he = data.he.replace(/(<(\D)>)([^<>]+)(<\/(\D)>)/g, "$3"); //stopgap solution for now.
           var cells = [
           [title, data.heTitle /*add perek num*/],
           [data.text, ""]
           ];
           var tableStyle = {};
               tableStyle[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.TIMES_NEW_ROMAN;
               tableStyle[DocumentApp.Attribute.FONT_SIZE] =
                12;
               tableStyle[DocumentApp.Attribute.BOLD] = false;
           var doc = DocumentApp.getActiveDocument().getBody();
           doc.appendTable(cells).setAttributes(tableStyle).getCell(1,1).insertParagraph(0, "").setLeftToRight(false).appendText(data.he);
}
function sefariaSearch() {
       var searchGetHtml = HtmlService.createHtmlOutputFromFile('searchpane')
          .setTitle('Search All Texts')
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
function returnParsha(aliyah) {
    var purl = 'http://www.sefaria.org/api/texts/parashat_hashavua';
    var presponse = UrlFetchApp.fetch(purl);
    var pjson = presponse.getContentText();
    var pdata = JSON.parse(pjson);
    if(aliyah == "haf") {
        return pdata.haftara[0];
     }
     return pdata.aliyot[aliyah];
}
function findSearch(inp) {
    inp = inp || "במחבואה נחביתי";
    var retdata = [];
    var surl = 'http://d1.sefaria.org:9200/sefaria/_search?q='+inp+'&size=100';
    var sresponse = UrlFetchApp.fetch(surl);
    var sjson = sresponse.getContentText();
    var sdata = JSON.parse(sjson);
      for(var n = 0; n<100; n++) {
          if(sdata["hits"]["hits"][n]["_type"] == "text") {
          retdata.push(sdata["hits"]["hits"][n]);
      }
     }
    return retdata;
  }
function bibMaker() {
   DocumentApp.getUi().alert("Add a \"Sources Cited\" section to the bottom of the page with all the sources that Sefaria can find cited in your Document.");
   var doc = DocumentApp.getActiveDocument().getBody();
  var bibAttr = {};
          bibAttr[DocumentApp.Attribute.FONT_FAMILY] =
                DocumentApp.FontFamily.CALIBRI;
          bibAttr[DocumentApp.Attribute.FONT_SIZE] =
                20;
          bibAttr[DocumentApp.Attribute.BOLD] =
                true;
  var text = doc.editAsText().getText();
  var titleList = returnTitles();
  titleList = titleList.join("|");
  var reg = "("+titleList+" )?( )?\\d+[ab]?(:\\d+(-\\d+)?)?"; //add better " " to tlist
  var regexpr = new RegExp(reg, "gi");	
  var regarr = text.match(regexpr);
  doc.appendParagraph("Sources Cited:").setAttributes(bibAttr);
  function recFind(src, arr, re) {
    if(re.test(arr[src])) {
       var val = arr[src].split(" ");
       val.pop();
       return val.join(" ");
    }
    else {
       return recFind(src-1, arr, re);
    }
  }
  for(var bib = 0; bib < regarr.length; bib++) {
    var regsp = /[a-z]/i;
    if (regsp.test(regarr[bib])) {
      findRef(regarr[bib], true);
    }
    else {
      regarr[bib] = recFind(bib, regarr, regsp)+" "+regarr[bib];
      regarr[bib] = regarr[bib].replace(/\s+/, " ");
      findRef(regarr[bib], true);
    }
  }
}

          ///                                         //        \
        //////                                      \     \\\\\  \\\
      ///****//                                      \         \    \
    ///////*////                                      \     \   \    \          
     //****///          
      //////
       ///
