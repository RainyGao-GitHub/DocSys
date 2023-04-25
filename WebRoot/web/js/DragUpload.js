
/*
  DragUpload was created based on dropzone.js 
 */
function DragUploadInit(e, parentNode)
{
	var drapUpload = new DragUpload(parentNode);
	return drapUpload.getFileList(e);
}

function DragUpload(_parentNode) {
	var parentNode = _parentNode;
	var result = [];
	var readRequestCount = 0;
	var readResponseCount = 0;
	var options = {
		  /**
		   * Whether hidden files in directories should be ignored.
		   */
		  ignoreHiddenFiles: true,			
	};
	
	function dropzone_createForOfIteratorHelper(o, allowArrayLike) 
	{ 
		var it; 
		if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) 
		{ 
			if (Array.isArray(o) || (it = dropzone_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") 
			{ 
				if (it) o = it; 
				var i = 0; 
				var F = function F() {}; 
				return { 
					s: F, 
					n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, 
					e: function e(_e) { throw _e; }, f: F }; 
			} 
			throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); 
		} 
		
		var normalCompletion = true, didErr = false, err; 
		return { 
			s: function s() { it = o[Symbol.iterator](); }, 
			n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, 
			e: function e(_e2) { didErr = true; err = _e2; }, 
			f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } 
		}; 
	}
	
	function getFileList(e) 
	{	
		if (!e.dataTransfer) 
		{
			console.log("getFileList() e.dataTransfer is null");
			return result;
		}
		
	    var files = [];
	
	    for (var i = 0; i < e.dataTransfer.files.length; i++) {
	      files[i] = e.dataTransfer.files[i];
	    } // Even if it's a folder, files.length will contain the folders.
	
	
	    if (files.length) 
	    {
	    	var items = e.dataTransfer.items;
	    	
	    	if (items && items.length && items[0].webkitGetAsEntry != null) 
	    	{
	    		// The browser supports dropping of folders, so handle items instead of files
	    		return _addFilesFromItems(items);
	    	} 
	    	else 
	    	{
	    	    console.log("getFileList() result is ready, result size:" + result.length);
	    	    if(result.length > 0)
	    	    {
	    	    	checkUserUploadRight(files,parentNode,uploadConfirm);
	    	    }
	    		return;
	    	}
	    }
	    
	    //触发用户上传确认
	    console.log("getFileList() result is ready, result size:" + result.length);
	    if(result.length > 0)
	    {
	    	checkUserUploadRight(result,parentNode,uploadConfirm);
	    }
	}
		
	function _addFilesFromItems(items) {
		//console.log("_addFilesFromItems items:", items);
	    var _iterator6 = dropzone_createForOfIteratorHelper(items, true),
	        _step6;
	    
	    var resultIsReady = true;
		try {
			for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) 
			{
				var item = _step6.value;
				var entry;
	
				if (item.webkitGetAsEntry != null && (entry = item.webkitGetAsEntry())) 
				{
					console.log("_addFilesFromItems entry:", entry);
					if (entry.isFile) 
					{
						result.push(item.getAsFile());
					} 
					else if (entry.isDirectory) 
					{
						//var folderFile = buildFile(entry);
						//result.push(folderFile);
						// Append all files from that directory to files
						resultIsReady = false;
						_addFilesFromDirectory(entry, entry.name);
					} 
					else 
					{
						result.push(undefined);
					}
				} else if (item.getAsFile != null) {
					if (item.kind == null || item.kind === "file") 
					{
						result.push(item.getAsFile());
					} else {
						result.push(undefined);
					}
				} else {
					result.push(undefined);
				}
			}
	    } catch (err) {
	      _iterator6.e(err);
	    } finally {
	      _iterator6.f();
	    }
	
	    if(resultIsReady == true)
	    {
		    console.log("_addFilesFromItems() result is ready, result size:" + result.length);
		    if(result.length > 0)
		    {
		    	checkUserUploadRight(result, parentNode, uploadConfirm);
		    }
	    }
	    return;
	}
	
	function buildFile(entry){
		var file = {};
		file.name = entry.name;
		file.size = 0;
		file.isDirectory = true;
		return file;
	}
	
	function _addFilesFromDirectory(directory, path) 
	{
	    console.log("_addFilesFromDirectory path:", path);
	
	    var dirReader = directory.createReader();
	    
	    var successHandler = function (entries) 
	    {
	    	console.log("_addFilesFromDirectory successHandler path:", path);
	    	console.log("_addFilesFromDirectory successHandler entries.length:" + entries.length);
	    	
	        if (entries.length > 0) 
	        {
	        	var _iterator7 = dropzone_createForOfIteratorHelper(entries, true),
		            _step7;
		
	        	try 
	        	{
		            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) 
		            {
		              var entry = _step7.value;
		
		              if (entry.isFile) 
		              {
		            	 entry.file(function (file) {
		            		  if (options.ignoreHiddenFiles && file.name.substring(0, 1) === ".") {
		                        return;
		                      }

		                      file.fullPath = "".concat(path, "/").concat(file.name);
			                  result.push(file);		                      
		                      return; _this5.addFile(file);
		                 });		                
		              } else if (entry.isDirectory) {
		            	  var folderFile = buildFile(entry);
		            	  folderFile.fullPath = "".concat(path, "/").concat(entry.name);
		            	  result.push(folderFile);
						  _addFilesFromDirectory(entry, folderFile.fullPath);
		              }
		            } 
		            // Recursively call readEntries() again, since browser only handle
		            // the first 100 entries.
		            // See: https://developer.mozilla.org/en-US/docs/Web/API/DirectoryReader#readEntries		
		          } catch (err) {
		            _iterator7.e(err);
		          } finally {
		            _iterator7.f();
		          }		
		          readEntries();
	        }
	        
	    	readResponseCount++;
	    	console.log("_addFilesFromDirectory successHandler readResponseCount:" + readResponseCount + " readRequestCount:" + readRequestCount);
	    	if(readResponseCount >=  readRequestCount)
	    	{
	    	    console.log("_addFilesFromDirectory() result is ready, result size:" + result.length);
	    	    if(result.length > 0)
	    	    {
	    	    	checkUserUploadRight(result,parentNode,uploadConfirm);
	    	    }
	    	}
		};
		
	    var errorHandler = function errorHandler(error) {
	    	console.log("_addFilesFromDirectory errorHandler path:", path);

		    return __guardMethod__(console, "log", function (o) {
		        return o.log(error);
		    });
	    };
	
	    var readEntries = function readEntries() 
	    {
	    	//注意: dirReader.readEntries是异步调用
	    	readRequestCount++;
	    	console.log("_addFilesFromDirectory readResponseCount:" + readResponseCount + " readRequestCount:" + readRequestCount);
	    	return dirReader.readEntries(successHandler, errorHandler);
	    };
	
	    return readEntries();
	}

	//开放给外部的调用接口
	return {
		getFileList: function(e){
			return getFileList(e);
	    },
	};
}
