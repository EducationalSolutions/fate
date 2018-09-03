;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'groundwater_threepoint';
	var defaults = {};

	function Plugin(element, options) {
		this.element = element;
		// override any passed options with url parameters
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults; // store the original defaults
		this._name = pluginName;
		this._calculated = {};
		this._formValues = {};
		this._activeValues = {};
		this._colors = {
			timeOne : '#BF6083',
			timeTwo : '#1197B4',
			timeThree : '#A69F3F',
			timeFour : '#D94F30'
		};
		this.init();
	}
	Plugin.prototype = {
		init: function() {
			var $plugin = this;
			$plugin._loadFormValues();
	
			// determine what values we're actually using
			$plugin._setActiveValues();
	
			$plugin._mapWidth = 450;
			$plugin._wellWidth = 50;
			$plugin._canvasWidth = 1000;
			// make wells draggable
			$('.map .well').draggable({
				containment: "parent",
				stop: function() {
					var thisPos = $(this).position();
					var parentPos = $(this).parent().position();
					//var x = (thisPos.left - parentPos.left);
					//var y = (thisPos.top - parentPos.top);
					var x = (thisPos.left - parentPos.left)/$plugin._mapWidth * $plugin._canvasWidth;
					var y = $plugin._canvasWidth - (thisPos.top - parentPos.top)/$plugin._mapWidth * $plugin._canvasWidth;

					//$(this).text(x + ", " + y);
					var wellNumber = $(this).attr('id').replace('well-', '');
					$('input.x' + wellNumber).val($plugin._formatForDisplay(x));
					$('input.y' + wellNumber).val($plugin._formatForDisplay(y));
					$('.groundwaterThreePoint input:first').trigger('change');
				}
			});
			
			// set initial well locations
			$('.map #well-1')
				.css('top', ($plugin._canvasWidth - $plugin._activeValues['y1']) * $plugin._mapWidth / $plugin._canvasWidth)
				.css('left', $plugin._activeValues['x1']*$plugin._mapWidth / $plugin._canvasWidth);
			$('.map #well-2')
				.css('top', ($plugin._canvasWidth - $plugin._activeValues['y2']) * $plugin._mapWidth / $plugin._canvasWidth - $plugin._wellWidth)
				.css('left', $plugin._activeValues['x2']*$plugin._mapWidth / $plugin._canvasWidth);
			$('.map #well-3')
				.css('top', ($plugin._canvasWidth - $plugin._activeValues['y3']) * $plugin._mapWidth / $plugin._canvasWidth - (2 * $plugin._wellWidth))
				.css('left', $plugin._activeValues['x3']*$plugin._mapWidth / $plugin._canvasWidth);
			
			
			$plugin._groundwaterThreePoint();
			$plugin._rotateArrow();

			$('.verify .angle').text($plugin._formatForDisplay($plugin._activeValues['angle']));
			
			// call ourself if something changes
			$('.groundwaterThreePoint').off('change', 'input,select');
			$('.groundwaterThreePoint').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'GroundwaterStep'}, 'GroundwaterStep', currentState.toString());
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				x1 : Number($('input.x1').val()),
				y1 : Number($('input.y1').val()),
				h1 : Number($('input.h1').val()),
				x2 : Number($('input.x2').val()),
				y2 : Number($('input.y2').val()),
				h2 : Number($('input.h2').val()),
				x3 : Number($('input.x3').val()),
				y3 : Number($('input.y3').val()),
				h3 : Number($('input.h3').val())
			};
			$.map($plugin._formValues, function(v, i) {
				//console.log(v, i);
				if(v > 1000) {
					$plugin._formValues[i] = 1000;
					$('input.'+i).val(1000);
				}
				else if(v < 0) {
					$plugin._formValues[i] = 0;
					$('input.'+i).val(0);
				}
				
			});
			//console.log($plugin._formValues)
		},
		_setActiveValues: function() {
			var $plugin = this;
			// default to the form values
			$plugin._activeValues = $plugin._formValues;
			
		},
		_calculateDirection: function() {
			var $plugin = this;
			var aXb = $plugin._aCrossB();
			//nXv = nCrossV(aXb);
			//nXe = nCrossE(nXv);
			//streamline = calcStreamline(nXe);
			var streamline = $plugin._calcAll(aXb);
	
			var angle = Math.atan(streamline[1]/streamline[0]);
			angle = Number(angle) * (180 / Math.PI);
			//console.log ("angle = " + angle);
	 		//console.log(streamline);
			var quadrant = 0;
			if(streamline[0] > 0 && streamline[1] > 0) {
				quadrant = 1;
				angle = 90 - angle;
			}
			if(streamline[0] > 0 && streamline[1] < 0) {
				quadrant = 2;
				angle = Math.abs(angle) + 90;
			}
			if(streamline[0] < 0 && streamline[1] > 0) {
				quadrant = 4;
				angle = Math.abs(angle) - 90;
			}
			if(streamline[0] < 0 && streamline[1] < 0) {
				quadrant = 3;
				angle = -(angle + 90);
			}
			//console.log("streamline[0]" + streamline[0] + "  " + "streamline[1]" + streamline[1] + "  " + "quadrant" + quadrant  + "  " + "angle" + angle);
			streamline.push(angle);
			//console.log("streamline[3]" + streamline[3] + "  " + "angle" + angle);
			return angle;
		},
		_aCrossB: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			//returns crossed array
			var aXb = [[values['x3'] - values['x2'], values['y3'] - values['y2'], values['h3'] - values['h2']],[values['x3'] - values['x1'], values['y3'] - values['y1'], values['h3'] - values['h1']]];
			//console.log(aXb);
			return aXb;
		},
		_calcAll: function(aXb) {
			var sX = -((aXb[0][0] * aXb[1][1] - aXb[0][1] * aXb[1][0])*(-(aXb[0][1] * aXb[1][2] - aXb[0][2] * aXb[1][1])));
			var sY = (aXb[0][0] * aXb[1][1] - aXb[0][1] * aXb[1][0])*(aXb[0][2] * aXb[1][0] - aXb[0][0] * aXb[1][2]);
			var sZ = ((aXb[0][1] * aXb[1][2] - aXb[0][2] * aXb[1][1])*(-(aXb[0][1] * aXb[1][2] - aXb[0][2] * aXb[1][1])))-Math.pow(aXb[0][2] * aXb[1][0] - aXb[0][0] * aXb[1][2], 2);

			var streamline = [sX, sY, sZ];
			//console.log(streamline);
			return streamline;
		},
		_rotateArrow: function() {
			var $plugin = this;
		
			$('.map .arrow').css('transform', 'rotate('+ $plugin._activeValues['angle'] +'deg)');
		},
		_formatForDisplay: function(x) {
			x = Math.round(x); 
			return x;
		},
		_groundwaterThreePoint: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['angle'] = $plugin._calculateDirection();
		}
	};

	$.fn[pluginName] = function ( options ) {
		return this.each(function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
			}
		});
	};
})(jQuery, JXG, window, document);

// call the plugin
(function($){
	// load any form elements if we have any in the url

	var query = URI(window.location).query(true);
	$.each(query, function(k,v) {
		$('.' + k).val(v);
	});
	
	// then initialize groundwater puls
	$('.groundwater-threepoint-form').groundwater_threepoint();
})(jQuery);
