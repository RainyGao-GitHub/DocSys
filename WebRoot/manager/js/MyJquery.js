//MyJquery类
var MyJquery = (function () {
  	function getValue(id)
	{
  		return $("#" + id).val();
	}
  	
  	function setValue(id, value)
	{
  		$("#" + id).val(value);
	}
  	
  	function getText(id)
	{
  		return $("#" + id).text();
	}
  	
  	function setText(id, text)
	{
  		$("#" + id).text(text);
	}
  	
  	function disable(id)
	{
  		$("#" + id).attr("disabled","disabled");
	}

  	function enable(id)
	{
  		$("#" + id).attr("disabled",false);
	}
  	
  	function isChecked(id)
  	{
  		return $("#" + id).is(':checked')? 1: 0;
  	}	
  	
  	function hide(id)
  	{
  		return $("#" + id).hide();
  	}	

  	function show(id)
  	{
  		return $("#" + id).show();
  	}	
  	
  	function focus(id)
  	{
  		return $("#" + id).focus();
  	}	
  	
  	function select(id, index)
  	{
  		return $("#" + id).get(0).selectedIndex=index;
  	}
  	
  	//弹出对话框操作接口
  	function closeBootstrapDialog(id){ 
  		console.log("closeBootstrapDialog " + id);
  		$("#"+id).modal('hide');
  		//$("#"+id + "div").remove();	//删除全屏遮罩
  		//$("#"+id).remove();	//删除对话框
  	}

	//开放给外部的调用接口
    return {
    	getValue: function(id){
    		return getValue(id);
        },    
    	setValue: function(id,value){
    		setValue(id,value);
        },
    	getText: function(id){
    		return getText(id);
        },    
    	setText: function(id,text){
    		setText(id,text);
        },
        disable: function(id){
        	disable(id);
        },   
        enable: function(id){
        	enable(id);
        },   
        isChecked: function(id){
        	return isChecked(id);
        },
        hide: function(id){
        	hide(id);
        }, 
        show: function(id){
        	show(id);
        },        
        focus: function(id){
        	focus(id);
        }, 
        select: function(id, index){
        	select(id, index);
        },
        closeBootstrapDialog: function(id){
    		closeBootstrapDialog(id);
        },   
    };
})();
    