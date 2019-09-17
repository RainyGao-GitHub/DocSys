
/*
  fileReader was created based on dropzone.js 
 */

	function getFileList(e) {
      var files, items;
      if (!e.dataTransfer) {
        return;
      }

      files = e.dataTransfer.files;

      if (files.length) {
        items = e.dataTransfer.items;
    	console.log("items",items);

        if (items && items.length && (items[0].webkitGetAsEntry != null)) {
        	console.log("_addFilesFromItems");
        	return _addFilesFromItems(items);
        } else {
        	return files;
        }
      }
    }
	
    function _addFilesFromItems (items) {
      var entry, item, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if ((item.webkitGetAsEntry != null) && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) {
            _results.push(item.getAsFile());
          } else if (entry.isDirectory) {
            _addFilesFromDirectory(entry, entry.name,_results);
          } else {
            _results.push(void 0);
          }
        } else if (item.getAsFile != null) {
          if ((item.kind == null) || item.kind === "file") {
            _results.push(item.getAsFile());
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }

    function _addFilesFromDirectory(directory, path,_result) {
    	var dirReader, errorHandler, readEntries;
    	dirReader = directory.createReader();
    	errorHandler = function(error) {
    		return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log(error) : void 0 : void 0;
    	};
    	
        function readEntries() 
        {
      	  return dirReader.readEntries(function(entries) {
              var entry, _i, _len;
              if (entries.length > 0) {
                for (_i = 0, _len = entries.length; _i < _len; _i++) {
                  entry = entries[_i];
                  if (entry.isFile) {
                    entry.file(function(file) {
                      file.fullPath = "" + path + "/" + file.name;
                      _result.push(file);
                    });
                  } else if (entry.isDirectory) {
                    _addFilesFromDirectory(entry, "" + path + "/" + entry.name,_result);
                  }
                }
              }
              return _result;
            }, errorHandler);
       }
      
        return readEntries();
     }
