;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'groundwater_pulse';
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
		this._boards = {};
		this._points = {};
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
			
			$plugin._calculateR();
			$plugin._calculateVV();
			$plugin._calculateMtKg();
			$plugin._calculateK();

			// Update view and active mt
			switch($plugin._activeValues['massType']) {
				case 'mg':
					$plugin._activeValues['mt'] = $plugin._activeValues['mtkg'];
					$('.massType-kg').show();
					$('.massType-ci').hide();
				break;
				case 'mCi':
					$plugin._activeValues['mt'] = $plugin._activeValues['mtci'];
					$('.massType-kg').hide();
					$('.massType-ci').show();
				break;
			}
						
			$('.verify .r').text($plugin._formatForDisplay($plugin._activeValues['r']));
			$('.verify .n').text($plugin._formatForDisplay($plugin._activeValues['n']));
			$('.verify .vv').text($plugin._formatForDisplay($plugin._activeValues['vv']));
			var mtkg = new Intl.NumberFormat('en-US').format($plugin._formatForDisplay($plugin._activeValues['mtkg']));
			$('.verify .mtkg').text(mtkg);
		
			$('.verify .k').text($plugin._formatForDisplay($plugin._activeValues['k']));
			var mt = new Intl.NumberFormat('en-US').format($plugin._formatForDisplay($plugin._activeValues['mt']));
			$('.verify .mt').text(mt);
			$('.verify .massType').text($plugin._activeValues['massType']);
			
			$plugin._updateCalculatedConcentration();
			
			// plot
			$plugin._buildVaryTimeGraph();
			$plugin._buildVaryDistanceGraph();
			
			// call ourself if something changes
			$('.groundwaterPulse').off('change', 'input,select');
			$('.groundwaterPulse').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'GroundwaterPulse'}, 'GroundwaterPulse', currentState.toString());
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				kd : Number($('input.kd').val()),
				bulkDensity : Number($('input.bulkDensity').val()),
				n : Number($('input.n').val()),
				a : Number($('input.a').val()),
				massType : $('select.massType').val(),
				vol : Number($('input.vol').val()),
				c : Number($('input.c').val()),
				mtci : Number($('input.mtci').val()),
				halfLife : Number($('input.halfLife').val()),
				v : Number($('input.v').val()),
				d : Number($('input.d').val()),
				graphDistanceVaryTime : Number($('input.graphDistanceVaryTime').val()),
				graphTimeVaryDistance : Number($('input.graphTimeVaryDistance').val()),
				concentrationDistance : Number($('input.concentrationDistance').val()),
				concentrationTime : Number($('input.concentrationTime').val()),
				halfLifeIncrement : $('select.halfLifeIncrement').val(),
				increments : {
					'year': 1,
					'day': 365,
					'hour': 365 * 24,
					'minute': 365 * 24 * 60
					/*
					'year': 365 * 24 * 60 * 60,
					'day': 24 * 60 * 60,
					'hour': 60 * 60,
					'minute': 60
					*/
				}
			};
			$plugin._formValues.factor = $plugin._formValues.increments[$plugin._formValues.halfLifeIncrement];
			//console.log($plugin._formValues)
		},
		_setActiveValues: function() {
			var $plugin = this;
			// default to the form values
			$plugin._activeValues = $plugin._formValues;
			// determine which E value to use
			switch($('select.eMethod').val()) {
				case 'calculated':
					$plugin._activeValues['e'] = $plugin._calculated['e'];
				break;
				case 'entered':
					$plugin._activeValues['e'] = $plugin._formValues['eEntered'];
				break;
			}	
		},
		_calculateR: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate R
			
			$plugin._activeValues['r'] = 1 + ((values['bulkDensity'] * values['kd'])/values['n']);
		},
		_calculateVV: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate VV
			
			$plugin._activeValues['vv'] = values['a'] * values['n'];
		},
		_calculateMtKg: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate Mt
			
			$plugin._activeValues['mtkg'] = values['vol'] * values['c'];
		},
		_calculateK: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// calculate k
			$plugin._activeValues['rateConstantCalcNum'] = -(Math.log(0.5) / values['halfLife']);
			// convert k to seconds			
			$plugin._activeValues['k'] = $plugin._activeValues['rateConstantCalcNum'] / values['factor'];
		},
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// update the calculated point value
			var calcResult = $plugin._groundwaterPulse({t: values['concentrationTime'], d: values['concentrationDistance'], log: true});
			var massType = values['massType'];
			if(massType == 'Ci') {
				massType = 'mCi';
			}
			if(massType == 'Kg') {
				massType = 'g';
			}
			$plugin._activeValues['massTypeDisplay'] = massType + '/L';
			$('.verify .calc-result').text($plugin._formatForDisplay(calcResult) + ' ' + $plugin._activeValues['massTypeDisplay']);
		},
		
		_buildVaryTimeGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			var d = values['graphDistanceVaryTime'];
			var v = values['v'];
			var r = values['r'];
			
			var Xmax = (d * r)/ v;
			var Ymax = $plugin._groundwaterPulse({ t: Xmax , d: d });
			var Xtest = Xmax * 0.95;
			var Ytest = $plugin._groundwaterPulse({ t: Xtest, d: d });
			var i = 1;
			while(Ytest > Ymax) {
				Xtest = Xtest * 0.95;
				Ymax = Ytest;
				Ytest = $plugin._groundwaterPulse({ t: Xtest, d: d });
				i++;
				if(i > 50) {
					break;
				}
			}	
	
			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax * 2, // x max
				-Ymax * 0.1 // y min
			];

			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingTimeBoard'] = JXG.JSXGraph.initBoard('varyingTimeGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});
			
			$plugin._boards['varyingTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._groundwaterPulse({t: x, d: values['graphDistanceVaryTime']});
			}], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']});
			$plugin._boards['varyingTimeBoard'].on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._groundwaterPulse({t: x, d: values['graphDistanceVaryTime']});
				if($plugin._points['varyingTimePoint'] != undefined) {
					$plugin._points['varyingTimePoint'].remove();
				}
				$plugin._points['varyingTimePoint'] = $plugin._boards['varyingTimeBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, showInfobox: false});
				$plugin._points['varyingTimePoint'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingTimePoint'].setLabelText('(' + x + ', ' + y + ')');
			});
			// labels
			$('.y-axis-label.varyingTimeGraph').html('Concentration in ' + values['massTypeDisplay']);
			$('.x-axis-label.varyingTimeGraph').html('Time in Years');
			
		},
		_buildVaryDistanceGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// determine what to show in the graph
			var t = values['graphTimeVaryDistance'];
			var v = values['v'];
			var r = values['r'];

			var Xmax = (v / r) * t;
			var Ymax = $plugin._groundwaterPulse({ t: t , d: Xmax });
			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax * 2, // x max
				-Ymax * 0.1 // y min
			];

			JXG.Options.text.useMathJax = true;

			$plugin._boards['varyingDistanceBoard'] = JXG.JSXGraph.initBoard('varyingDistanceGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});
			$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
				return $plugin._groundwaterPulse({t: values['graphTimeVaryDistance'], d: x});
			}], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._groundwaterPulse({t: values['graphTimeVaryDistance'], d: x});
				if($plugin._points['varyingDistancePoint'] != undefined) {
					$plugin._points['varyingDistancePoint'].remove();
				}
				$plugin._points['varyingDistancePoint'] = $plugin._boards['varyingDistanceBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, showInfobox: false});
				$plugin._points['varyingDistancePoint'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingDistancePoint'].setLabelText('(' + x + ', ' + y + ')');
		
			});
			// labels
			$('.y-axis-label.varyingDistanceGraph').html('Concentration in ' + values['massTypeDisplay']);
			$('.x-axis-label.varyingDistanceGraph').html('Distance in Meters');
			
		},
		
		_getMouseCoords: function(e, i, boardName) {
			var $plugin = this;
			var cPos = $plugin._boards[boardName].getCoordsTopLeftCorner(e, i),
				absPos = JXG.getPosition(e, i),
				dx = absPos[0] - cPos[0],
				dy = absPos[1] - cPos[1];
			return new JXG.Coords(JXG.COORDS_BY_SCREEN, [dx, dy], $plugin._boards[boardName]);
		},
		_formatForDisplay: function(x) {
			if(x < 0.01 || x > top) {
				x = x.toExponential(3);
			}
			else {
				x = Math.round(x * 1000) / 1000; 
			}
			return x;
		},
		_groundwaterPulse: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// d should be in meters
			// t should be in years
	
			var t = points['t'];
			var x = points['d'];
			var d = values['d'];
			var v = values['v'];
			var r = values['r'];
			var k = values['k'];
			var a = values['a'];
			var mt = values['mt'];
			if(points['log'] != undefined) {
				console.log({ t: t, x: x, v: v, r: r, D: d, k: k, mt: mt, a: a});
				// console.log("first",  mt / (a * Math.sqrt(4 * Math.PI * (d / r) * t)));
			}
			return mt / (a * Math.sqrt(4 * Math.PI * (d / r) * t)) * Math.pow(Math.E, -1 * (Math.pow(x - (v / r) * t, 2) / (4 * (d / r) * t)) - k * t);
			// return values['mt'] / (values['vv'] * Math.sqrt(4 * Math.PI * (values['d'] / values['r']) * t)) * Math.pow(Math.E, -(Math.pow(d - (values['v'] / values['r']) * t, 2) / (4 * (values['d'] / values['r']) * t)) - values['k'] * t);
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
	$('.groundwater-pulse-form').groundwater_pulse();
})(jQuery);
