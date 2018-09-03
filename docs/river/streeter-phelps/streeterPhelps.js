;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'river_streeter_phelps';
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
			
			//$plugin._calculated['e'] = $plugin._calculateE();
			//$('span.eCalculated').text(Math.round($plugin._calculated['e'] * 100) / 100);
						
			// determine what values we're actually using
			$plugin._setActiveValues();
			// calculate lots of things
			$plugin._calculateDO();
			$plugin._calculateEqTemp();
			$plugin._calculateInitialDO();
			$plugin._calculateBOD5();
			$plugin._calculateBODL();
			$plugin._correctK1();
			$plugin._correctK2();
			$plugin._calculateD0();
			$plugin._calculateTC();
			$plugin._calculateXC();
			$plugin._calculateDOL();
			$plugin._calculateDOC();
			$plugin._calculatebod5cp();

			$('.saturation-concentration strong, .verify .saturation-concentration').text($plugin._activeValues['saturation-concentration']);
			$('.do strong, .verify .do').text($plugin._activeValues['do']);
			$('.streamTemp strong, .verify .streamTemp').text($plugin._activeValues['streamTemp']);
			
			
			$('.verify .eqTemp').text($plugin._formatForDisplay($plugin._activeValues['eqTemp']));
			$('.verify .do0').text($plugin._formatForDisplay($plugin._activeValues['do0']));
			$('.verify .bod5').text($plugin._formatForDisplay($plugin._activeValues['bod5']));
			$('.verify .bodL').text($plugin._formatForDisplay($plugin._activeValues['bodL']));
			$('.verify .wasteTemp').text($plugin._formatForDisplay($plugin._activeValues['wasteTemp']));
			$('.verify .k2').text($plugin._formatForDisplay($plugin._activeValues['k2']));
			$('.verify .k1').text($plugin._formatForDisplay($plugin._activeValues['k1']));
			$('.k2Coefficient strong').text($plugin._formatForDisplay($plugin._activeValues['k2Corrected']));
			$('.k1Coefficient strong').text($plugin._formatForDisplay($plugin._activeValues['k1Corrected']));
			$('.verify .d0').text($plugin._formatForDisplay($plugin._activeValues['d0']));
			$('.verify .tc').text($plugin._formatForDisplay($plugin._activeValues['tc']));
			$('.verify .xc').text($plugin._formatForDisplay($plugin._activeValues['xc']));
			$('.verify .doL').text($plugin._formatForDisplay($plugin._activeValues['doL']));
			$('.verify .doC').text($plugin._formatForDisplay($plugin._activeValues['doC']));
			$('.verify .bod5cp').text($plugin._formatForDisplay($plugin._activeValues['bod5cp']));			
			
			$plugin._updateCalculatedConcentration();

			// plot
			$plugin._buildVaryTimeGraph();
			
			// call ourself if something changes
			$('.river-streeter-phelps-form').off('change', 'input,select');
			$('.river-streeter-phelps-form').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'RiverStreeterPhelps'}, 'RiverStreeterPhelps', currentState.toString());
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				k1 : Number($('input.k1').val()),
				k2 : Number($('input.k2').val()),
				streamTemp : Number($('input.streamTemp').val()),
				doPercent : Number($('input.doPercent').val()),
				wasteTemp : Number($('input.wasteTemp').val()),
				streamFlow : Number($('input.streamFlow').val()),
				wasteFlow : Number($('input.wasteFlow').val()),
				wasteDO0 : Number($('input.wasteDO0').val()),
				streamBOD5 : Number($('input.streamBOD5').val()),
				wasteBOD5 : Number($('input.wasteBOD5').val()),
				k2Coefficient : Number($('input.k2Coefficient').val()),
				k1Coefficient : Number($('input.k1Coefficient').val()),
				v : Number($('input.v').val()),
				concentrationDistance : Number($('input.concentrationDistance').val()),
				increments : {
					'year': 365 * 24 * 60 * 60,
					'day': 24 * 60 * 60,
					'hour': 60 * 60,
					'minute': 60
				}
			};
			//$plugin._formValues.factor = $plugin._formValues.increments[$plugin._formValues.halfLifeIncrement];
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
		_calculateDO: function() {
			var $plugin = this;
			
			if ($plugin._formValues['streamTemp'] < 0) {
				$plugin._activeValues['saturation-concentration'] = 14.62;
				$plugin._formValues['streamTemp'] = 0;
			}
			if (($plugin._formValues['streamTemp'] >= 0) && ($plugin._formValues['streamTemp'] < 0.5)) {
				$plugin._activeValues['saturation-concentration'] = 14.62;
				$plugin._formValues['streamTemp'] = 0;
			}
			if (($plugin._formValues['streamTemp'] >= 0.5) && ($plugin._formValues['streamTemp'] < 1.5)) {
				$plugin._activeValues['saturation-concentration'] = 14.23;
				$plugin._formValues['streamTemp'] = 1;
			}
			if (($plugin._formValues['streamTemp'] >= 1.5) && ($plugin._formValues['streamTemp'] < 2.5)) {
				$plugin._activeValues['saturation-concentration'] = 13.84;
				$plugin._formValues['streamTemp'] = 2;
			}
			if (($plugin._formValues['streamTemp'] >= 2.5) && ($plugin._formValues['streamTemp'] < 3.5)) {
				$plugin._activeValues['saturation-concentration'] = 13.48;
				$plugin._formValues['streamTemp'] = 3;
			}
			if (($plugin._formValues['streamTemp'] >= 3.5) && ($plugin._formValues['streamTemp'] < 4.5)) {
				$plugin._activeValues['saturation-concentration'] = 13.13;
				$plugin._formValues['streamTemp'] = 4;
			}
			if (($plugin._formValues['streamTemp'] >= 4.5) && ($plugin._formValues['streamTemp'] < 5.5)) {
				$plugin._activeValues['saturation-concentration'] = 12.80;
				$plugin._formValues['streamTemp'] = 5;
			}
			if (($plugin._formValues['streamTemp'] >= 5.5) && ($plugin._formValues['streamTemp'] < 6.5)) {
				$plugin._activeValues['saturation-concentration'] = 12.48;
				$plugin._formValues['streamTemp'] = 6;
			}
			if (($plugin._formValues['streamTemp'] >= 6.5) && ($plugin._formValues['streamTemp'] < 7.5)) {
				$plugin._activeValues['saturation-concentration'] = 12.17;
				$plugin._formValues['streamTemp'] = 7;
			}
			if (($plugin._formValues['streamTemp'] >= 7.5) && ($plugin._formValues['streamTemp'] < 8.5)) {
				$plugin._activeValues['saturation-concentration'] = 11.87;
				$plugin._formValues['streamTemp'] = 8;
			}
			if (($plugin._formValues['streamTemp'] >= 8.5) && ($plugin._formValues['streamTemp'] < 9.5)) {
				$plugin._activeValues['saturation-concentration'] = 11.59;
				$plugin._formValues['streamTemp'] = 9;
			}
			if (($plugin._formValues['streamTemp'] >= 9.5) && ($plugin._formValues['streamTemp'] < 10.5)) {
				$plugin._activeValues['saturation-concentration'] = 11.33;
				$plugin._formValues['streamTemp'] = 10;
			}
			if (($plugin._formValues['streamTemp'] >= 10.5) && ($plugin._formValues['streamTemp'] < 11.5)) {
				$plugin._activeValues['saturation-concentration'] = 11.08;
				$plugin._formValues['streamTemp'] = 11;
			}
			if (($plugin._formValues['streamTemp'] >= 11.5) && ($plugin._formValues['streamTemp'] < 12.5)) {
				$plugin._activeValues['saturation-concentration'] = 10.83;
				$plugin._formValues['streamTemp'] = 12;
			}
			if (($plugin._formValues['streamTemp'] >= 12.5) && ($plugin._formValues['streamTemp'] < 13.5)) {
				$plugin._activeValues['saturation-concentration'] = 10.60;
				$plugin._formValues['streamTemp'] = 13;
			}
			if (($plugin._formValues['streamTemp'] >= 13.5) && ($plugin._formValues['streamTemp'] < 14.5)) {
				$plugin._activeValues['saturation-concentration'] = 10.37;
				$plugin._formValues['streamTemp'] = 14;
			}
			if (($plugin._formValues['streamTemp'] >= 14.5) && ($plugin._formValues['streamTemp'] < 15.5)) {
				$plugin._activeValues['saturation-concentration'] = 10.15;
				$plugin._formValues['streamTemp'] = 15;
			}
			if (($plugin._formValues['streamTemp'] >= 15.5) && ($plugin._formValues['streamTemp'] < 16.5)) {
				$plugin._activeValues['saturation-concentration'] = 9.95;
				$plugin._formValues['streamTemp'] = 16;
			}
			if (($plugin._formValues['streamTemp'] >= 16.5) && ($plugin._formValues['streamTemp'] < 17.5)) {
				$plugin._activeValues['saturation-concentration'] = 9.74;
				$plugin._formValues['streamTemp'] = 17;
			}
			if (($plugin._formValues['streamTemp'] >= 17.5) && ($plugin._formValues['streamTemp'] < 18.5)) {
				$plugin._activeValues['saturation-concentration'] = 9.54;
				$plugin._formValues['streamTemp'] = 18;
			}
			if (($plugin._formValues['streamTemp'] >= 18.5) && ($plugin._formValues['streamTemp'] < 19.5)) {
				$plugin._activeValues['saturation-concentration'] = 9.35;
				$plugin._formValues['streamTemp'] = 19;
			}
			if (($plugin._formValues['streamTemp'] >= 19.5) && ($plugin._formValues['streamTemp'] < 20.5)) {
				$plugin._activeValues['saturation-concentration'] = 9.17;
				$plugin._formValues['streamTemp'] = 20;
			}
			if (($plugin._formValues['streamTemp'] >= 20.5) && ($plugin._formValues['streamTemp'] < 21.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.99;
				$plugin._formValues['streamTemp'] = 21;
			}
			if (($plugin._formValues['streamTemp'] >= 21.5) && ($plugin._formValues['streamTemp'] < 22.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.83;
				$plugin._formValues['streamTemp'] = 22;
			}
			if (($plugin._formValues['streamTemp'] >= 22.5) && ($plugin._formValues['streamTemp'] < 23.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.68;
				$plugin._formValues['streamTemp'] = 23;
			}
			if (($plugin._formValues['streamTemp'] >= 23.5) && ($plugin._formValues['streamTemp'] < 24.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.53;
				$plugin._formValues['streamTemp'] = 24;
			}
			if (($plugin._formValues['streamTemp'] >= 24.5) && ($plugin._formValues['streamTemp'] < 25.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.38;
				$plugin._formValues['streamTemp'] = 25;
			}
			if (($plugin._formValues['streamTemp'] >= 25.5) && ($plugin._formValues['streamTemp'] < 26.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.22;
				$plugin._formValues['streamTemp'] = 26;
			}
			if (($plugin._formValues['streamTemp'] >= 26.5) && ($plugin._formValues['streamTemp'] < 27.5)) {
				$plugin._activeValues['saturation-concentration'] = 8.07;
				$plugin._formValues['streamTemp'] = 27;
			}
			if (($plugin._formValues['streamTemp'] >= 27.5) && ($plugin._formValues['streamTemp'] < 28.5)) {
				$plugin._activeValues['saturation-concentration'] = 7.92;
				$plugin._formValues['streamTemp'] = 28;
			}
			if (($plugin._formValues['streamTemp'] >= 28.5) && ($plugin._formValues['streamTemp'] < 29.5)) {
				$plugin._activeValues['saturation-concentration'] = 7.77;
				$plugin._formValues['streamTemp'] = 29;
			}
			if (($plugin._formValues['streamTemp'] >= 29.5) && ($plugin._formValues['streamTemp'] < 30.5)) {
				$plugin._activeValues['saturation-concentration'] = 7.63;
				$plugin._formValues['streamTemp'] = 30;
			}
			if ($plugin._formValues['streamTemp'] >= 30.5) {
				$plugin._activeValues['saturation-concentration'] = 7.63;
				$plugin._formValues['streamTemp'] = 30;
			}
			 $plugin._activeValues['do'] = $plugin._activeValues['doPercent'] / 100 *  $plugin._activeValues['saturation-concentration'];
		},
		_calculateEqTemp: function() {
			var $plugin = this;
			var values = $plugin._activeValues;

			$plugin._activeValues['eqTemp'] = (values['wasteFlow'] * values['wasteTemp'] + values['streamFlow'] * values['streamTemp'])/(values['wasteFlow'] + values['streamFlow']);
		
		},
		_calculateInitialDO: function() {
			var $plugin = this;
			var values = $plugin._activeValues;

			$plugin._activeValues['do0'] = (values['wasteFlow'] * values['wasteDO0'] + values['streamFlow'] * values['saturation-concentration'])/(values['wasteFlow'] + values['streamFlow']);
		},
		_calculateBOD5: function() {
			var $plugin = this;
			var values = $plugin._activeValues;

			$plugin._activeValues['bod5'] = (values['wasteFlow'] * values['wasteBOD5'] + values['streamFlow'] * values['streamBOD5'])/(values['wasteFlow'] + values['streamFlow']);

		},
		_calculateBODL: function() {
			var $plugin = this;
			var values = $plugin._activeValues;

			$plugin._activeValues['bodL'] = (values['bod5'] / (1 - Math.pow(Math.E, -5 * values['k1'])));

		},
		_correctK2: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['k2Corrected'] = values['k2'] * Math.pow(values['k2Coefficient'], (values['eqTemp'] - 20));
		},
		_correctK1: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['k1Corrected'] = values['k1'] * Math.pow(values['k1Coefficient'], (values['eqTemp'] - 20));
		},
		_calculateD0: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['d0'] = values['saturation-concentration'] - values['do0'];
	
		},
		_calculateTC: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['tc'] = (1 / (values['k2Corrected'] - values['k1Corrected'])) * (Math.log(values['k2Corrected'] / values['k1Corrected']) / Math.log(Math.E)) * (1 - (values['d0'] * (values['k2Corrected'] - values['k1Corrected'])) / (values['k1Corrected'] * values['bodL']));
		},
		_calculateXC: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['xc'] = values['v'] * 24 * values['tc'];
		},
		_calculateDOL: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['doL'] = (values['k1Corrected'] / values['k2Corrected']) * values['bodL'] * Math.pow(Math.E, (-values['k1Corrected'] * (values['xc'] / (values['v'] * 24))));

		},
		_calculateDOC: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['doC'] = values['saturation-concentration'] - (values['k1Corrected'] / values['k2Corrected']) * values['bodL'] * Math.pow(Math.E, (-values['k1Corrected'] * values['tc']));

		},
		_calculatebod5cp: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			$plugin._activeValues['bod5cp'] = values['bodL'] * Math.pow(Math.E, (-values['k1Corrected'] * values['tc'])) * (1 - Math.pow(Math.E, (-values['k1'] * 5)));

		},
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			
			// update the calculated point value
			var calcResult = $plugin._streeterPhelps({d: values['concentrationDistance'] * 1000});
			
			$('strong.calc-result').text($plugin._formatForDisplay(calcResult));
		},
		_buildVaryTimeGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
						
			var Xmax = 10 * values['xc'];
			
			// highest is always at time 0
			var Ymax = $plugin._streeterPhelps({d: Xmax});
			//console.log(Xmax, Ymax);

			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax, // x max
				-Ymax * 0.1 // y min
			];
	
			//console.log(boundingBox);
			//var boundingBox = [-1, 0.00001, 6, -0.00001];
			
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingDistanceBoard'] = JXG.JSXGraph.initBoard('varyingDistanceGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
				return $plugin._streeterPhelps({d: x});
			},0], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._streeterPhelps({d: x});
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
			$('.y-axis-label').html('Concentration in mg 0<sub>2</sub>/Liter');
			$('.x-axis-label').html('Distance in Kilometers');
			
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
			if(x < 0.01 || x > 900000) {
				x = x.toExponential(3);
			}
			else {
				x = Math.round(x * 1000) / 1000; 
			}
			return x;
		},
		_streeterPhelps: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// d needs to be converted to m
			d = points['d'];		
			return (values['doPercent'] / 100 * values['saturation-concentration']) - (((values['k1Corrected'] * values['bodL']) / (values['k2Corrected'] - values['k1Corrected'])) * (Math.pow(Math.E, (-values['k1Corrected'] * d / (values['v'] * 24))) - Math.pow(Math.E, (-values['k2Corrected'] * d / (values['v'] * 24)))) + values['d0'] * Math.pow(Math.E, (-values['k2Corrected'] * d / (values['v'] * 24))));
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
	
	// then initialize river puls
	$('.river-streeter-phelps-form').river_streeter_phelps();
})(jQuery);
