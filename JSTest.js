   var fullFile;
   var stops = new Array();//Obj based on SEQ
   var manifest = new Array();//Obj based on ADDRESS
   var readableList = new Array();//Formatted (61) 8537 : 5146 RIVER RD
   var buttonList = new Array();//HTML formatted for buttons to reorder
   var newList = new Array();//"Output" list after reorder
   var addHistory = new Array();//list of indices to facilitate undo function
   var addressList = new Array();//list of Addresses only. To facilitate easier lookups
   var garminFile;
   var csvOut;
   var pinsFile;

   function readFile(input) {
      let file = input.files[0];
    
      let reader = new FileReader();
    
      reader.readAsText(file);
    
      reader.onload = function() {
         fullFile = reader.result;
         //console.log(reader.result);
         split_gpx();
         process_gpx();
         document.getElementById("prelist").innerHTML=buttonList.join("");
      };
    
      reader.onerror = function() {
         console.log(reader.error);
      };

      
    
   }

   function stop(address, latitude, longitude, sequence, sid, index) {
      this.address = address;
      this.latitude =  latitude;
      this.longitude = longitude;
      this.sequence = sequence;
      this.sid = sid;
      this.index = index;
      this.historyIndex = "";

      this.replot = function (latitude,longitude){
         this.latitude = latitude;
         this.longitude = longitude;
      }

      this.logHistory = function(historyIndex){
         this.historyIndex = historyIndex;
      }

      this.toTriple = function(){
         return "(" + this.sequence + ") " + this.sid + " : " + this.address;
      }

      this.toAddButton = function(){
         return "<div class=\"stop\"><input type=\"button\" value=\"" + this.toTriple() + "\" onclick=\"addStop(\'" + this.address + "\')\"></div><br>";
      }

      this.toUndoButton = function(){
         return "<div class=\"stop\"><input type=\"button\" value=\"" + this.toTriple() + "\" onclick=\"undoAdd(\'" + this.address + "\')\"></div><br>";
      }

      this.toReadable = function(){
         return "<div class=\"stop\">" + this.toTriple() + "</div>";
      }

      this.toGarmin = function(){
         return "\n\t\t<rtept lon=\""+this.longitude+"\" lat=\""+this.latitude+"\">\n\t\t\t<name>Seq "+this.sequence+":SID "+this.sid+":"+this.address+"</name>\n\t\t</rtept>"
      }

      this.toOsmPin = function(){
         return "\n<wpt lat=\""+this.latitude+"\" lon=\""+this.longitude+"\">\n\t<name>"+this.toTriple()+" (~~Notes)<\/name>\n\t<desc>~~Notes<\/desc>\n\t<type>Waypoints<\/type>\n\t<extensions>\n\t\t<icon>special_flag_stroke<\/icon>\n\t\t<background>circle<\/background>\n\t\t<color>#663399<\/color>\n\t<\/extensions>\n<\/wpt>";
      }


   }

   function readableToAddress(readable){
      var toReturn = readable.split(": ");
      toReturn = toReturn[1].split("<");
      return toReturn[0];
   }

   function buttonToAddress(readable){
      var toReturn = readable.split(": ");
      toReturn = toReturn[1].split("\" onclick");
      return toReturn[0];
   }

   function split_gpx(){
      stops = fullFile.split("<rtept lon=\"");
      stops.shift();
      // console.log(stops.length);
      // console.log(stops);
   }

   function process_gpx(){
      for(i=0;i<stops.length;i++){
         //-86.117504|____|44.348541">\n<name>Seq 41:SID 8599:9219 JOHNSON RD</name>\n</rtept>
         var latSplit = stops[i].split("\" lat=\"");
         var longitude = latSplit[0];
         //44.348541|____|<name>Seq 41:SID 8599:9219 JOHNSON RD</name>\n</rtept>
         var longSplit = latSplit[1].split("\">");
         var latitude = longSplit[0];
         //<na|____|Seq 41:SID 8599:9219 JOHNSON RD</name>\n</rtept>
         var trashSplit = longSplit[1].split("me>");
         //Seq 41:SID 8599:9219 JOHNSON RD|____|name>\n</rtept>
         var infoSplit = trashSplit[1].split("</");
         //Seq 41|____|SID 8599|____|9219 JOHNSON RD
         var tripleSplit = infoSplit[0].split(":");
         var sequence = tripleSplit[0].split(" ");
         var sid = tripleSplit[1].split(" ");
         var address = tripleSplit[2];
         manifest[address] = new stop(address,latitude,longitude,sequence[1],sid[1], i);
         readableList[i] = manifest[address].toReadable();
         buttonList[i] = manifest[address].toAddButton();
         addressList[i] = address;
      }
   }

   // function loadFile(){
   //    document.getElementById("prelist").innerHTML=buttonList.join("");
   // }

   function addStop(address){
      newList.push(manifest[address].toReadable());
      delete buttonList[manifest[address].index];
      addHistory.push(manifest[address].index);
      manifest[address].logHistory(addHistory.length);
      document.getElementById("prelist").innerHTML=buttonList.join("");
      document.getElementById("postlist").innerHTML=newList.join("<br><br>");
   }

   function undoAdd(){
      var toUndo = newList.pop().split(": ");
      toUndo=toUndo[1].split("<");
      buttonList.splice(addHistory.pop(),1,manifest[toUndo[0]].toAddButton());
      document.getElementById("prelist").innerHTML=buttonList.join("");
      document.getElementById("postlist").innerHTML=newList.join("<br><br>");
   }

   function finishReorder(){
         buttonList = [];
         addressList = [];
         for(i=0;i<newList.length;i++){
            var address = readableToAddress(newList[i]);
            buttonList.push(manifest[address].toAddButton());
            addressList[i] = address;
         }
         newList = [];
         document.getElementById("prelist").innerHTML=buttonList.join("");
         document.getElementById("postlist").innerHTML=newList.join("<br><br>");
         exportToCsv();
         exportToOsmPins();
         exportToGarmin();    
   }

   function exportToGarmin(){
      let d = new Date().toISOString().slice(0, 10)
      garminFile = "<?xml version='1.0' encoding='UTF-8'?>\n<gpx version=\"1.0\" creator=\"Avenue\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.topografix.com/GPX/1/0\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/0 http://www.topografix.com/GPX/1/0/gpx.xsd\">\n\t<rte>\n\t\t<name>"+ d +"</name>";
      for(i=0;i<buttonList.length;i++){
         garminFile+=manifest[addressList[i]].toGarmin();
      }
      garminFile+="\n\t</rte>\n</gpx>"
      //console.log(garminFile);
      document.getElementById("fileOutput").innerHTML="<section class=\"fileOut\"><xmp id=\"garminOut\">"+garminFile+"<\/xmp></section>";
      return garminFile;
   }

   function downloadGarmin(){
      let d = new Date().toISOString().slice(0, 10)
      a = document.createElement('a');
      a.href = "data:application/octet-stream,"+encodeURIComponent(garminFile);
      a.download = d+' - Garmin.gpx';
      a.click();
   }


   // Probably won't need this now that files can be downloaded. Leaving code here for reference
   // 
   // function copyGarminToClipboard() {
   //    // Clipboard API supported?
   //    if (!navigator.clipboard) return;

   //    // copy text to clipboard
   //    if (navigator.clipboard.writeText) {
   //       navigator.clipboard.writeText(garminFile);
   //    }

   //    // // get text from clipboard
   //    // if (navigator.clipboard.readText) {
   //    // const text = await navigator.clipboard.readText();
   //    // }
   // }

   function exportToCsv(){
      csvOut = "";
      for(i=0;i<buttonList.length;i++){
         csvOut+=manifest[addressList[i]].toTriple()+",";
      }
      //console.log(csvOut);
      document.getElementById("fileOutput").innerHTML="<section class=\"fileOut\"><xmp id=\"csvOut\">"+csvOut+"<\/xmp><input type=\"button\" value=\"Download\" onclick=\"downloadCSV()\"></section>";
      return csvOut;
   }

   function downloadCSV(){
      let d = new Date().toISOString().slice(0, 10)
      a = document.createElement('a');
      a.href = "data:application/octet-stream,"+encodeURIComponent(csvOut);
      a.download = d+'.csv';
      a.click();
   }

   function exportToOsmPins(){
      //color is ff3fff00 for green-plotted, ffffd8 for yellow-plotted, ffff0000 for unplotted
      let d = new Date().toISOString().slice(0, 10)
      pinsFile = "<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\' ?>\n\t<gpx version=\"1.1\" creator=\"Avenue\" xmlns=\"http:\/\/www.topografix.com\/GPX\/1\/1\" xmlns:xsi=\"http:\/\/www.w3.org\/2001\/XMLSchema-instance\" xsi:schemaLocation=\"http:\/\/www.topografix.com\/GPX\/1\/1 http:\/\/www.topografix.com\/GPX\/1\/1\/gpx.xsd\">\n\t\t<metadata>\n\t\t\t<name>Waypoints "+d+"<\/name>\n\t\t<\/metadata>";
      for(i=0;i<buttonList.length;i++){
         pinsFile+=manifest[addressList[i]].toOsmPin();
      }
      pinsFile+="\n</gpx>"
      //console.log(pinsFile);
      document.getElementById("fileOutput").innerHTML="<section class=\"fileOut\"><xmp id=\"pinsFile\">"+pinsFile+"<\/xmp><input type=\"button\" value=\"Download\" onclick=\"downloadOsmPins()\"></section>";
      return pinsFile;
   }

   
   function downloadOsmPins(){
      let d = new Date().toISOString().slice(0, 10)
      a = document.createElement('a');
      a.href = "data:application/octet-stream,"+encodeURIComponent(pinsFile);
      a.download = d+' - OSM Expanded.gpx';
      a.click();
   }




