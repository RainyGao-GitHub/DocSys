;(function($){
var gizmoMenu={
		defaults:{
			click_to_close:true,	// IF CLICKING DOCUMENT CLOSES MENU
			menu:'gizmoBurger',		// MENU CLASS NAME (gizmoBurger, gizmoDropDown, gizmoHorizontal)
			stay_open:false			// KEEP MENU OPEN WHEN JUMPING TO ANOTHER CONTEXT MENU
		}, 
	
/***********************************************************************************************/
// INITIALIZE
/***********************************************************************************************/
init:function(options){
	var o=options,
		$this=$(this);
		
	/////////////////
	// EACH gizmoMenu
	/////////////////
	$this.each(function(i){
		// MERGE USER OPTIONS WITH DEFAULTS
		var $this=$(this),
			settings=$.extend({}, gizmoMenu.defaults, o),
			$menu=$('.'+settings.menu);
		
		// STAY_OPEN SETTING KEEPS MENU OPEN WHEN OPENING ANOTHER
		if(!settings.stay_open) $menu.addClass('gizmoMenu_close_me');

		//////////////////////////////
		// INITIAL SETUP FOR HAMBURGER
		//////////////////////////////
		if(settings.menu==='gizmoBurger'){
			var $ul=$this.find('ul.gizmoMenu > li > ul'),
	        	$a=$this.find('ul.gizmoMenu > li > a');
		    $ul.hide();
			
			$this.find('ul.gizmoMenu').addClass('gizmo2');

			// gizmoMenu MENU ITEM CLICK HANDLER
    		$a.on('click',function(e){
        		e.preventDefault();
				var $this=$(this),
					$menu=$this.parents('.gizmoMenu:first');

		        if(!$this.hasClass('active')){
					$menu.find('.active').removeClass('active');			
        		    $ul.filter(':visible').slideUp('normal');
	        	    $this.addClass('active').next().stop(true,true).slideDown('normal');
	    	    }else{
		    	 	$this.removeClass('active').next().stop(true,true).slideUp('normal');
				};
			});			
		};

		////////////////////////////////////////////
		// CLOSE MENU IF ANY OTHER BUTTON IS CLICKED
		////////////////////////////////////////////
		$this.on('mousedown',function(e){
			if(e.which!==3 && $(e.target).parents('.gizmoMenu').length < 1 && settings.click_to_close){
				$this.find('.gizmoMenu').stop(true,false).animate({opacity:0},{duration:100,queue:false,complete:function(){
					// CLOSE ANY OPEN gizmoMENUS
					$(this).css('display','none').find('.active').removeClass('active').next().stop(true,true).slideUp('normal');
				}});
			};
		});
		
			
		///////////////////
		// OPEN CONTEXTMENU
		///////////////////
		$this.on('contextmenu', function(e){
			e.preventDefault();
			e.stopPropagation();
			gizmoMenu.getCoords(e);
			
			////////////////////////////////////////
			// CLOSE OTHERS IF STAY_OPEN IF DISABLED
			////////////////////////////////////////
			$('.gizmoMenu_close_me').stop(true,false).animate({opacity:0},{duration:100,queue:false,complete:function(){
				$(this).css('display','none');
			}});

			var top=Coords.clientY, 
				left=($('body')[0]===e.target) ? Coords.clickX : Coords.clientX;

			// SHOW AND POSITION CONTEXTMENU
			$menu.css({ top:top+'px', left:left+'px', display:'block'})
				.stop(true,false).animate({opacity:1},{duration:100,queue:false});
		});
	});
},


/***********************************************************************************************/
// GETS MOUSE CLICK COORDINATES
/***********************************************************************************************/
getCoords:function(e){
	var evt=e ? e : window.event;
	var clickX=0, 
		clickY=0;

	if((evt.clientX || evt.clientY) && document.body && document.body.scrollLeft!=null){
		clickX=evt.clientX+document.body.scrollLeft;
		clickY=evt.clientY+document.body.scrollTop;
	};

	if((evt.clientX || evt.clientY) && document.compatMode=='CSS1Compat' && document.documentElement && document.documentElement.scrollLeft!=null){
		clickX=evt.clientX+document.documentElement.scrollLeft;
		clickY=evt.clientY+document.documentElement.scrollTop;
	};
	
	if(evt.pageX || evt.pageY){
		clickX=evt.pageX;
		clickY=evt.pageY;
	};

	return Coords={
		clickX:clickX,
	  	clickY:clickY,
		clientX:evt.clientX,
		clientY:evt.clientY,
		screenX:evt.screenX,
		screenY:evt.screenY};
}};

/***********************************************************************************************/
// PLUGIN DEFINITION
/***********************************************************************************************/
$.fn.gizmoMenu=function(method,options){
	if(gizmoMenu[method]){ return gizmoMenu[method].apply(this,Array.prototype.slice.call(arguments,1));
	}else if(typeof method==='object'||!method){ return gizmoMenu.init.apply(this,arguments);
	}else{ $.error('Method '+method+' does not exist'); }
}})(jQuery);

// EXTEND NATIVE CLASSES
String.prototype.removeWS=function(){return this.toString().replace(/\s/g, '');};
String.prototype.pF=function(){return parseFloat(this);};
Number.prototype.pF=function(){return parseFloat(this);};