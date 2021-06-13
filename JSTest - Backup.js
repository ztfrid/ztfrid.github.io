   var fullFile;
   var stops = new Array();

   function readFile(input) {
      let file = input.files[0];
    
      let reader = new FileReader();
    
      reader.readAsText(file);
    
      reader.onload = function() {
         fullFile = reader.result;
        console.log(reader.result);
        split_gpx();
        process_gpx();
        //document.write(reader.result);
      };
    
      reader.onerror = function() {
        console.log(reader.error);
      };
    
   }

   function stop(address, latitude, longitude, sequence, sid) {
      this.address = address;
      this.latitude =  latitude;
      this.longitude = longitude;
      this.sequence = sequence;
      this.sid = sid;

      this.replot = function (latitude,longitude){
         this.latitude = latitude;
         this.longitude = longitude;
      }
   }

   function split_gpx(){
      stops = fullFile.split("<rtept lon=\"");
      stops.shift();
      console.log(stops.length);
      console.log(stops);
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
         stops[i]=new stop(tripleSplit[2],latitude,longitude,sequence[1],sid[1]);
      }
      console.log(stops);
   }

   function testbutton(){
      var fullList = "";
      for(i=0;i<stops.length;i++){
         fullList = fullList + "(" + stops[i].sequence + ") " + stops[i].sid + " : " + stops[i].address + "<br>";
      }
      document.write(fullList);
   }