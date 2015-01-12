/**
 * Fetch some data from cityzen data api
 * 
 * einstein: String einstein request
 *
 * In case of error this method return an object
 * { err: "errMsg" }
 *
 * In case of success this method return an array of objects
 * [
 *   {
 *      timestamp: Number,
 *      value: Number,
 *      latitude: Number,
 *      longitude: Number,
 *      elevation: Number,
 *   },
 *   ...
 * ]
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function fetch(einstein) {
  var options =
      {
        "method" : "post",
        "payload" : einstein,
        "muteHttpExceptions": true
      };
  
  var res = UrlFetchApp.fetch("http://api0.cityzendata.net/api/v0/exec/einstein", options);
  
  if(res.getResponseCode() === 200) {
    var json = JSON.parse(res.getContentText()),
        first = json[0][0],
        class = first.c,
        labels = first.l,
        attributes = first.a,
        id = first.i,
        values = first.v;
    
    var result = [];
    
    for (var i = 0; i <= values.length - 1; i++) {
      var row = values[i], 
          tmp = {};
      
      tmp.timestamp = row[0];
      tmp.value = row[row.length - 1];
      
      if(row.length === 3) {
        tmp.elevation = row[1];
      }
      else if(row.length === 4) {
        tmp.latitude = row[1];
        tmp.longitude = row[2];
      }
      else if(row.length === 5) {
        tmp.latitude = row[1];
        tmp.longitude = row[2];
        tmp.elevation = row[3];
      }
      
      result.push(tmp);
    }
    
    return result;    
  }
  else {
    Logger.log(res.getContentText());
    return {"err": res.getContentText()};
  }
};

function request(form) {
  var res = fetch(form.einstein);
  
  /*
  "'DOC-EGRESS-TOKEN'\n" +
    "'mozfest.light'\n" +
    "'moteId'\n" +
    "'53'\n" +
    "2 ->MAP\n" +
    "'2013-01-01T00:00:00.000Z'\n" +
    "'2014-01-01T00:00:00.000Z'\n" +
    "5 ->LIST\n" +
    "FETCH"
    */
    
  if(res.err) {
    return res.err;    
  }
  
  
  var sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange("A1:E" + sheet.getLastRow()).clear();
  
  sheet.insertRowBefore(2).getRange("A1:E1").setValues([["Timestamp", "value", "latitude", "longitude", "elevation"]]);
  
  for (var i = 0; i <= res.length - 1; i++) {
    var data = res[i];
    
    var log = [];
    log.push(data.timestamp);
    log.push(data.value);
    log.push(data.latitude);
    log.push(data.longitude);
    log.push(data.elevation);
    
    sheet.getRange("A" + (i+2) + ":E" + (i+2)).setValues([log]);
  }
  
  return '';
}

function requestUI() {
  var html = HtmlService.createHtmlOutputFromFile('form')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      .showModalDialog(html, 'Dialog title');
}

/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item
 * for invoking the readRows() function specified above.
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 * For more information on using the Spreadsheet API, see
 * https://developers.google.com/apps-script/service_spreadsheet
 */
function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Make request",
    functionName : "requestUI"
  }];
  spreadsheet.addMenu("Cityzen Data", entries);
};
