/* 
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 */

var context = context || (function () {
    
	var options = {
		fadeSpeed: 100,
		filter: function ($obj) {
			// Modify $obj, Do not return
		},
		above: 'auto',
		preventDoubleContext: true,
		compress: false
	};

	function initialize(opts) {
		
		options = $.extend({}, options, opts);
		
		$(document).on('click', 'html', function () {
			$('.dropdown-context').fadeOut(options.fadeSpeed, function(){
				$('.dropdown-context').css({display:''}).find('.drop-left').removeClass('drop-left');
			});
		});
		if(options.preventDoubleContext){
			$(document).on('contextmenu', '.dropdown-context', function (e) {
				e.preventDefault();
			});
		}
		$(document).on('mouseenter', '.dropdown-submenu', function(){
			var $sub = $(this).find('.dropdown-context-sub:first'),
				subWidth = $sub.width(),
				subLeft = $sub.offset().left,
				collision = (subWidth+subLeft) > window.innerWidth;
			if(collision){
				$sub.addClass('drop-left');
			}
		});
		
	}

	function updateOptions(opts){
		options = $.extend({}, options, opts);
	}

	function buildMenu(data, id, subMenu) {
		var subClass = (subMenu) ? ' dropdown-context-sub' : '',
			compressed = options.compress ? ' compressed-context' : '',
			$menu = $('<ul class="dropdown-menu dropdown-context' + subClass + compressed+'" id="dropdown-' + id + '"></ul>');
        var i = 0, linkTarget = '';
        for(i; i<data.length; i++) {
        	if (typeof data[i].divider !== 'undefined') {
				$menu.append('<li class="divider"></li>');
			} else if (typeof data[i].header !== 'undefined') {
				$menu.append('<li class="nav-header">' + data[i].header + '</li>');
			} else {
				if (typeof data[i].href == 'undefined') {
					data[i].href = '#';
				}
				if (typeof data[i].target !== 'undefined') {
					linkTarget = ' target="'+data[i].target+'"';
				}
				if (typeof data[i].subMenu !== 'undefined') {
					$sub = ('<li class="dropdown-submenu"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>');
				} else {
					$sub = $('<li><a tabindex="-1" href="' + data[i].href + '"'+linkTarget+'>' + data[i].text + '</a></li>');
				}
				if (typeof data[i].action !== 'undefined') {
					var actiond = new Date(),
						actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000),
						eventAction = data[i].action;
					$sub.find('a').attr('id', actionID);
					$('#' + actionID).addClass('context-event');
					$(document).on('click', '#' + actionID, eventAction);
				}
				$menu.append($sub);
				if (typeof data[i].subMenu != 'undefined') {
					var subMenuData = buildMenu(data[i].subMenu, id, true);
					$menu.find('li:last').append(subMenuData);
				}
			}
			if (typeof options.filter == 'function') {
				options.filter($menu.find('li:last'));
			}
		}
		return $menu;
	}

	function addContext(selector, data) {
		
		var d = new Date(),
			id = d.getTime(),
			$menu = buildMenu(data, id);
			
		$('body').append($menu);
		
		//Rainy added: so that user can call the show interface
		$(selector).val(id);
		 
		$(document).on('contextmenu', selector, function (e) {
			e.preventDefault();
			e.stopPropagation();
			
			showMenu(id,e);
		});
	}
	
	function destroyContext(selector) {
		$(document).off('contextmenu', selector).off('click', '.context-event');
	}
	
	function showMenu(id,e)
	{
		$('.dropdown-context:not(.dropdown-context-sub)').hide();
		
		$dd = $('#dropdown-' + id);
		$dd.removeClass('offset');
		
		var x = e.pageX + 10;
		var y = 0;
		if (typeof options.above == 'boolean' && options.above) {
			y = e.pageY - 20 - $('#dropdown-' + id).height();
		} else if (typeof options.above == 'string' && options.above == 'auto') {
			$dd.removeClass('offset');
			var autoH = $dd.height() + 12;
			y = e.pageY - 20 - autoH;
			if ((e.pageY + autoH) > $('html').height()) 
			{
			} 
			else 
			{
				y = e.pageY + 10;
			}
		}
		console.log("y" + y);
		if(y < 0)
		{
			y = 0;
		}
		
		$dd.css({
			top: y,
			left: x
		}).fadeIn(options.fadeSpeed);
	}
	
	function showMenuOffset(id,e,xOffset)
	{
		
		var top = e.pageY;
		var left = e.pageX + xOffset;
		
		$('.dropdown-context:not(.dropdown-context-sub)').hide();

		$dd = $('#dropdown-' + id);
		$dd.addClass('offset');
		
		var obj;
		var x = left  + 10;
		var y = 0;
		if (typeof options.above == 'boolean' && options.above) {
			y = top - 20 - $('#dropdown-' + id).height();
		} else if (typeof options.above == 'string' && options.above == 'auto') {
			var autoH = $dd.height() + 12;
			y = top - 20 - autoH;
			if ((top + autoH) > $('html').height()) 
			{
			} 
			else 
			{
				y = top + 10;
			}
		}
		
		console.log("y" + y);
		if(y < 0)
		{
			y = 0;
		}
		
		obj = $dd.css({
			top: y,
			left: x
		});
		obj.fadeIn(options.fadeSpeed);
	}
	
	function show(selector,e,xOffset) {
		var id = $(selector).val();
		if(xOffset != 0)
		{
			showMenuOffset(id,e,xOffset);
		}
		else
		{
			showMenu(id,e);
		}
	}
	
	return {
		init: initialize,
		settings: updateOptions,
		attach: addContext,
		show: show,	//Rainy added
		destroy: destroyContext
	};
})();