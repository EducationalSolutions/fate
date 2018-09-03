;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'river_step';
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
			$plugin._calculated['e'] = $plugin._calculateE();
			$('.verify .eCalculated').text($plugin._formatForDisplay($plugin._calculated['e']));
						
			// determine what values we're actually using
			$plugin._setActiveValues();
			
			$('.verify .m').text($plugin._formatForDisplay($plugin._activeValues['m']));
			$('.verify .w').text($plugin._formatForDisplay($plugin._activeValues['w']));
			$('.verify .d').text($plugin._formatForDisplay($plugin._activeValues['d']));
			$('.verify .v').text($plugin._formatForDisplay($plugin._activeValues['v']));
			$('.verify .q').text($plugin._formatForDisplay($plugin._activeValues['q']));
			$('.verify .e').text($plugin._formatForDisplay($plugin._activeValues['e']));
			$plugin._calculateK();
			$('.verify .k').text($plugin._formatForDisplay($plugin._activeValues['k']));
			$('.verify .massType').text($plugin._activeValues['massType']);
			$('.verify .rateConstantCalcNum').text($plugin._formatForDisplay($plugin._activeValues['rateConstantCalcNum']) + ' /' + $plugin._activeValues['halfLifeIncrement']);
			
			$plugin._updateCalculatedConcentration();

			// plot
			$plugin._buildVaryTimeGraph();
			
			// call ourself if something changes
			$('.riverStep').off('change', 'input,select');
			$('.riverStep').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'RiverStep'}, 'RiverStep', currentState.toString());
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				v : Number($('input.v').val()),
				w : Number($('input.w').val()),
				d : Number($('input.d').val()),
				g : Number($('input.g').val()),
				s : Number($('input.s').val()),
				q : Number($('input.q').val()),
				m : Number($('input.m').val()),
				massType : $('select.massType').val(),
				halfLife : Number($('input.halfLife').val()),
				concentrationDistance : Number($('input.concentrationDistance').val()),
				eEntered : Number($('input.eEntered').val()),
				eMethod : $('select.eMethod').val(),
				e : 0,
				halfLifeIncrement : $('select.halfLifeIncrement').val(),
				increments : {
					'year': 365 * 24 * 60 * 60,
					'day': 24 * 60 * 60,
					'hour': 60 * 60,
					'minute': 60
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
		_calculateE: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate E
			var e = 0.011 * ((Math.pow(values['v'], 2) * Math.pow(values['w'], 2)) / (values['d'] * Math.sqrt(values['g'] * values['s'] * values['d'])));

			return e;
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
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			
			// update the calculated point value
			var calcResult = $plugin._riverStep({d: values['concentrationDistance']});
			var massType = values['massType'];
			if(massType == 'Ci') {
				massType = 'mCi';
			}
			if(massType == 'Kg') {
				massType = 'mg';
			}
			$plugin._activeValues['massTypeDisplay'] = massType + '/L';
			$('span.calc-result').text($plugin._formatForDisplay(calcResult) + ' ' + $plugin._activeValues['massTypeDisplay']);
		},
		_buildVaryTimeGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
						
			// calculate the input mass (x = 0)
			var input = values['m'] /( values['q'] * Math.sqrt(1 + (4 * values['k'] * values['e'])/Math.pow(values['v'], 2))) * Math.pow(Math.E, ((values['v'] * 0)/(2 * values['e']) * (1 - Math.sqrt(1 + (4 * values['k'] * values['e'])/Math.pow(values['v'], 2)))));
	
			var Xmax = (2 * values['e'] * (Math.log((input * 2 * values['q'] * Math.sqrt(1 + 4 * values['k'] * values['e'] / (Math.pow(values['v'], 2)))) / values['w']) / Math.log(Math.E))) / (values['v'] * (1 - Math.sqrt(1 + 4 * values['k'] * values['e'] / (Math.pow(values['v'], 2))))) / 1000; // convert to km
			
			// highest is always at time 0
			var Ymax = $plugin._riverStep({d: 0});
			//console.log(Xmax, Ymax);

			var boundingBox = [
				-Xmax * 0.15, // x min
				Ymax * 1.25, // y max
				Xmax * 2.5, // x max
				-Ymax * 0.25 // y min
			];
	
			//console.log(boundingBox);
			//var boundingBox = [-1, 0.00001, 6, -0.00001];
			
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingDistanceBoard'] = JXG.JSXGraph.initBoard('varyingDistanceGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
				return $plugin._riverStep({d: x});
			},0], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverStep({d: x});
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
			$('.y-axis-label').html('Concentration in ' + values['massTypeDisplay']);
			$('.x-axis-label').html('Distance in kilometers');
			/*
			$plugin._boards['varyingDistanceBoard'].create('axis', [[0, 0], [1,0]], {
				name:'Time in hours',
				withLabel: true, 
				label: {
					position: 'rt',  // possible values are 'lft', 'rt', 'top', 'bot'
					offset: [50, 10]  // (in pixels)
				}
			});
			
			$plugin._boards['varyingDistanceBoard'].create('axis', [[0, 0], [0,1]], 
				{name:'Concentration in ' + values['massTypeDisplay'], 
				withLabel: true, 
				label: {
					position: 'rt',  // possible values are 'lft', 'rt', 'top', 'bot'
					offset: [50, 10],  // (in pixels)
					//rotate: 90
				}
			});
			*/
			//console.log($plugin._boards['varyingDistanceBoard']);
			//$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
			//	return $plugin._riverPulseTimeDerivative(t, x * 1000);
			//}]);
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
		_riverStep: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// d needs to be converted from m to km
			d = points['d'] * 1000;
			// notes
			// https://cloud.sagemath.com/projects/6cd38d3b-e4b8-46cb-9b8c-203bdb0139cc/files/Step%20Calculations.sagews

			// convert everything to km
			var m = values['m'] / 1000;
			var q = values['q'] / 1000 / 1000 / 1000; // km^3
			var e = values['e'] / 1000 / 10000; // km^2
			var v = values['v'] / 1000;
			var value_in_grams = (values['m'] / (values['q'] * Math.sqrt(1 + (4 * values['k'] * values['e'])/Math.pow(values['v'], 2)))) * Math.pow(Math.E, ((values['v'] * d )/(2 * values['e']) * (1 - Math.sqrt(1 + (4 * values['k'] * values['e'])/Math.pow(values['v'], 2)))));
			//value_in_grams = (m / (q * Math.sqrt(1 + (4 * values['k'] * e) / Math.pow(v, 2)))) * Math.pow(Math.E, ((v * d) / (2 * e) * (1 - Math.sqrt(1 + (4 * values['k'] * e) / Math.pow(v, 2)))));
			var value_in_mg = value_in_grams * 1000;
			//
			//(m / (q * sqrt(1 + (4 * k * z)/(v^2)))) * (e^((v * d )/(2 * z) * (1 - sqrt(1 + (4 * k * z)/(v^2)))))
			return value_in_mg;
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
	
	// then initialize river step
	$('.river-step-form').river_step();
})(jQuery);
