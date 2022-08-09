//ReposConfig类
var ReposConfig = (function () {
  	function getValueByName(type, name)
	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").val();
	}
  	
  	function getValueById(id)
	{
  		return $("#" + id).val();
	}
  	
  	function setValueByName(type, name, value)
	{
  		$("#dialog-new-repos " + type + "[name='" + name +"']").val(value);
	}
  	
  	function setValueById(id, value)
	{
  		$("#" + id).val(value);
	}
  	
  	function getTextByName(type, name)
	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").text();
	}
  	
  	function getTextById(id)
	{
  		return $("#" + id).text();
	}
  	
  	function setTextByName(type, name, text)
	{
  		$("#dialog-new-repos " + type + "[name='" + name +"']").text(text);
	}
  	
  	function setTextById(id, text)
	{
  		$("#" + id).text(text);
	}
  	
  	function disableByName(type, name)
	{
  		$("#dialog-new-repos " + type + "[name='" + name +"']").attr("disabled","disabled");
	}
  	
  	function enableByName(type, name)
	{
  		$("#dialog-new-repos " + type + "[name='" + name +"']").attr("disabled",false);
	}

  	function disableById(id)
	{
  		$("#" + id).attr("disabled","disabled");
	}

  	function enableById(id)
	{
  		$("#" + id).attr("disabled",false);
	}
  	
  	function isCheckedByName(type, name)
  	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").is(':checked')? 1: 0;
  	}	
  	
  	function isCheckedById(id)
  	{
  		return $("#" + id).is(':checked')? 1: 0;
  	}	
  	
  	function hideByName(type, name)
  	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").hide();
  	}	

  	function showByName(type, name)
  	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").show();
  	}	

  	function hideById(id)
  	{
  		return $("#" + id).hide();
  	}	

  	function showById(id)
  	{
  		return $("#" + id).show();
  	}	
  	
  	function focusByName(type, name)
  	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").focus();
  	}	
  	
  	function focusById(id)
  	{
  		return $("#" + id).focus();
  	}	
  	
  	function selectByName(type, name, index)
  	{
  		return $("#dialog-new-repos " + type + "[name='" + name +"']").get(0).selectedIndex=index;
  	}	
  	
  	function selectById(id, index)
  	{
  		return $("#" + id).get(0).selectedIndex=index;
  	}

	//开放给外部的调用接口
    return {
    	getValueByName: function(type,name){
    		return getValueByName(type,name);
        },
    	getValueById: function(id){
    		return getValueById(id);
        },    
    	setValueByName: function(type,name,value){
    		setValueByName(type,name,value);
        },
    	setValueById: function(id,value){
    		setValueById(id,value);
        },
    	getTextByName: function(type,name){
    		return getTextByName(type,name);
        },
    	getTextById: function(id){
    		return getTextById(id);
        },    
    	setTextByName: function(type,name,text){
    		setTextByName(type,name,text);
        },
    	setTextById: function(id,text){
    		setTextById(id,text);
        },
        disableByName: function(type,name){
        	disableByName(type,name);
        },
        enableByName: function(type,name){
        	enableByName(type,name);
        },
        disableById: function(id){
        	disableById(id);
        },   
        enableById: function(id){
        	enableById(id);
        },   
        isCheckedByName: function(type, name){
        	return isCheckedByName(type, name);
        },   
        isCheckedByeId: function(id){
        	return isCheckedByeId(id);
        },
        hideByName: function(type, name){
        	hideByName(type, name);
        },   
        hideByeId: function(id){
        	hideByeId(id);
        },        
        showByName: function(type, name){
        	showByName(type, name);
        },   
        showByeId: function(id){
        	showByeId(id);
        },        
        focusByName: function(type, name){
        	focusByName(type, name);
        },   
        focusById: function(id){
        	focusById(id);
        }, 
        selectByName: function(type, name, index){
        	selectByName(type, name, index);
        },   
        selectById: function(id, index){
        	selectById(id, index);
        }, 
    };
})();
    