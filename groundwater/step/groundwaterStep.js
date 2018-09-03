;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'groundwater_step';
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
			
			$plugin._calculateN();
			$plugin._calculateR();
			$plugin._calculateK();
			var kInPerMinute = $plugin._activeValues['k'] * 60;
			
			// update view for n method
			switch($plugin._activeValues['nMethod']) {
				case 'calculated':
					$plugin._activeValues['n'] = $plugin._activeValues['nCalculated'];
					$('.calculated-n').show();
					$('.entered-n').hide();
				break;
				case 'entered':
					$plugin._activeValues['n'] = $plugin._activeValues['nEntered'];
					$('.calculated-n').hide();
					$('.entered-n').show();
				break;
			}
			// update view for r method
			switch($plugin._activeValues['rMethod']) {
				case 'calculated':
					$plugin._activeValues['r'] = $plugin._activeValues['rCalculated'];
					$('.calculated-r').show();
					$('.entered-r').hide();
				break;
				case 'entered':
					$plugin._activeValues['r'] = $plugin._activeValues['rEntered'];
					$('.calculated-r').hide();
					$('.entered-r').show();
				break;
			}
			
			$('.verify .nCalculated').text($plugin._formatForDisplay($plugin._activeValues['nCalculated']));
			$('.verify .rCalculated').text($plugin._formatForDisplay($plugin._activeValues['rCalculated']));
			$('.verify .r').text($plugin._formatForDisplay($plugin._activeValues['r']));
			$('.verify .n').text($plugin._formatForDisplay($plugin._activeValues['n']));

			$('.verify .k').text($plugin._formatForDisplay($plugin._activeValues['k']));
			$('.verify .massType').text($plugin._activeValues['massType']);
			
			$plugin._updateCalculatedConcentration();
			
			// plot
			$plugin._buildVaryTimeGraph();
			$plugin._buildVaryDistanceGraph();
			
			// call ourself if something changes
			$('.groundwaterStep').off('change', 'input,select');
			$('.groundwaterStep').on('change', 'input,select', function() {
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
				nMethod : $('select.nMethod').val(),
				bulkDensity : Number($('input.bulkDensity').val()),
				solidsDensity : Number($('input.solidsDensity').val()),
				nEntered : Number($('input.nEntered').val()),
				rMethod : $('select.rMethod').val(),
				rEntered : Number($('input.rEntered').val()),
				kd : Number($('input.kd').val()),
				massType : $('select.massType').val(),
				halfLife : Number($('input.halfLife').val()),
				c0 : Number($('input.c0').val()),
				d : Number($('input.d').val()),
				v : Number($('input.v').val()),
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
		_calculateN: function() {
			var $plugin = this;
			var values = $plugin._activeValues;

			$plugin._activeValues['nCalculated'] = (1 - values['bulkDensity'] / values['solidsDensity']) * 100;
		},
		_calculateR: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// calculate R
			var n = 0;
			switch(values['nMethod']) {
				case 'calculated':
					n = values['nCalculated'];
				break;
				case 'entered':
					n = values['nEntered'];
				break;
			}
			$plugin._activeValues['rCalculated'] = 1 + values['bulkDensity'] * values['kd'] / (n / 100);
		},
		_calculateK: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// calculate k
			$plugin._activeValues['rateConstantCalcNum'] = -(Math.log(0.5) / values['halfLife']);
			// convert k to seconds			
			$plugin._activeValues['k'] = $plugin._activeValues['rateConstantCalcNum'] / values['factor'];
			//console.log('k: ' + $plugin._activeValues.k)
		},
		// Matti Kariluoma May 2012 
		// http://stackoverflow.com/questions/5971830/need-code-for-inverse-error-function
		_erfc: function(x)
		{
			z = Math.abs(x);
			t = 1.0 / (0.5 * z + 1.0);
			a1 = t * 0.17087277 + -0.82215223;
			a2 = t * a1 + 1.48851587;
			a3 = t * a2 + -1.13520398;
			a4 = t * a3 + 0.27886807;
			a5 = t * a4 + -0.18628806;
			a6 = t * a5 + 0.09678418;
			a7 = t * a6 + 0.37409196;
			a8 = t * a7 + 1.00002368;
			a9 = t * a8;
			a10 = -z * z - 1.26551223 + a9;
			a = t * Math.exp(a10);
	
			if (x < 0.0)
			{
				a = 2.0 - a;
			}
	
			return a;

		},
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// update the calculated point value
			var calcResult = $plugin._groundwaterStep({t: values['concentrationTime'], d: values['concentrationDistance']});
			var massType = values['massType'];
			if(massType == 'Ci') {
				massType = 'Ci';
			}
			if(massType == 'Kg') {
				massType = 'g';
			}
			$plugin._activeValues['massTypeDisplay'] = 'μ' + massType + '/L';
			$('.verify .calc-result').text($plugin._formatForDisplay(calcResult) + ' ' + $plugin._activeValues['massTypeDisplay']);
		},
		
		_buildVaryTimeGraph: function() {

			var $plugin = this;
			var values = $plugin._activeValues;	
			var d = values['graphDistanceVaryTime'];
			var i = 0;
			var groundStepIncrement = 0;
			var groundStepY = $plugin._groundwaterStep({t: groundStepIncrement, d: d});			
			var groundStepOldY = 0;
			var Xmax = 0;

			while (1) {
				groundStepIncrement += d/10;			
				groundStepY = $plugin._groundwaterStep({t: groundStepIncrement, d: d});

				if (groundStepY > groundStepOldY) {
					if ((groundStepY - groundStepOldY) < (groundStepY / 600)) {
						Xmax = groundStepIncrement;
						break;
					}
				}				
				
				if (i > 1000) {
					break;
				}
				i++;
				groundStepOldY = groundStepY;
				Xmax = groundStepIncrement;
			}
			
			var Ymax = $plugin._groundwaterStep({t: Xmax, d: d});

			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax * 1.2, // x max
				-Ymax * 0.1 // y min
			];
				
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingTimeBoard'] = JXG.JSXGraph.initBoard('varyingTimeGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._groundwaterStep({t: x, d: values['graphDistanceVaryTime']});
			}], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']});
			$plugin._boards['varyingTimeBoard'].on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._groundwaterStep({t: x, d: values['graphDistanceVaryTime']});
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
			var i = 0;
			var groundStepIncrement = 0.0001;
			var groundStepY = $plugin._groundwaterStep({t: t, d: groundStepIncrement});			
			//console.log(groundStepY);
			var groundStepOldY = 0;
			var groundStepTempYmax = 0;
			var Xmax = 0;
			
			groundStepY = $plugin._groundwaterStep({t: t,d:  groundStepIncrement});
			groundStepOldY = groundStepY;
			groundStepTempYmax = groundStepY;
			while (1) {
				groundStepIncrement += t / 10;
			
				groundStepY = $plugin._groundwaterStep({t: t,d:  groundStepIncrement});

				if (groundStepY > groundStepOldY) {
					groundStepTempYmax = groundStepY;
				}
				else {
					if (groundStepOldY <= (groundStepTempYmax / 100)) {
						Xmax = groundStepIncrement;
						break;
					}
				}
				if (i > 100) {
					break;
				}
				i++;
				groundStepOldY = groundStepY;
				Xmax = groundStepIncrement;
			}
			var Ymax = groundStepTempYmax;

			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax * 1.5, // x max
				-Ymax * 0.25 // y min
			];
			
			//var boundingBox = [-1, 0.001, 36, -0.001]

			JXG.Options.text.useMathJax = true;

			$plugin._boards['varyingDistanceBoard'] = JXG.JSXGraph.initBoard('varyingDistanceGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});
			$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
				return $plugin._groundwaterStep({t: values['graphTimeVaryDistance'], d: x});
			}], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']});
			$plugin._boards['varyingDistanceBoard'].on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._groundwaterStep({t: values['graphTimeVaryDistance'], d: x});
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
		_groundwaterStep: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// d should be in meters
			// t should be in years
			
			t = points['t'];
			d = points['d'];
	
			var getErfc = (d - (values['v'] / values['r'] * t * Math.pow(1 + 4 * values['k'] * values['d'] * values['r'] / values['v'], 0.5))) / (2 * Math.sqrt(values['d'] * values['v'] / values['r'] * t));
			var ErfcTemp = $plugin._erfc(getErfc);
			return (values['c0'] / 2) * Math.pow(Math.E, ((d / (2 * values['d']) * (1 - Math.pow(1 + 4 * values['k'] * values['d'] * values['r'] / values['v'], 0.5))))) * ErfcTemp;

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
	$('.groundwater-step-form').groundwater_step();
})(jQuery);
