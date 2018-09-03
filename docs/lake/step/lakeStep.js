;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'lake_step';
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
			$plugin._calculated['t0'] = $plugin._calculateT0();
			$('strong.t0Calculated').text($plugin._formatForDisplay($plugin._calculated['t0']));
						
			// determine what values we're actually using
			$plugin._setActiveValues();
			
			$plugin._calculateK();

			// convert k back to /year for display, since we divided by the increment before, we'll multiply twice
			var kInPerYear = $plugin._activeValues['k'] * $plugin._formValues.increments[$plugin._formValues.halfLifeIncrement] * $plugin._formValues.increments[$plugin._formValues.halfLifeIncrement];
			$plugin._calculateDecayRate();
			
			$('.verify .t0').text($plugin._formatForDisplay($plugin._activeValues['t0']));
			$('.verify .v').text($plugin._formatForDisplay($plugin._activeValues['v']));
	
			$('.verify .k').text($plugin._formatForDisplay(kInPerYear));
			
			$('.verify .decayRate').text($plugin._formatForDisplay($plugin._activeValues['decayRate']));
			$('div.rateConstantCalcNum').text($plugin._formatForDisplay($plugin._activeValues['rateConstantCalcNum']) + ' /' + $plugin._activeValues['halfLifeIncrement']);
			
			$plugin._updateCalculatedConcentration();

			// plot
			$plugin._buildVaryTimeGraph();
			
			// call ourself if something changes
			$('.lakeStep').off('change', 'input,select');
			$('.lakeStep').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'LakeStep'}, 'LakeStep', currentState.toString());
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				v : Number($('input.v').val()),
				q : Number($('input.q').val()),
				halfLife : Number($('input.halfLife').val()),
				concentrationTime : Number($('input.concentrationTime').val()),
				t0Entered : Number($('input.t0Entered').val()),
				t0Method : $('select.t0Method').val(),
				w : Number($('input.w').val()),
				halfLifeIncrement : $('select.halfLifeIncrement').val(),
				massType : $('select.massType').val(),
				timeType : $('select.timeType').val(),
				increments : {
					'year': 1, //365 * 24 * 60 * 60,
					'day': 365, //24 * 60 * 60,
					'hour': 8760, //60 * 60,
					'minute': 525600, //60
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
			switch($('select.t0Method').val()) {
				case 'calculated':
					$plugin._activeValues['t0'] = $plugin._calculated['t0'];
				break;
				case 'entered':
					$plugin._activeValues['t0'] = $plugin._formValues['t0Entered'];
				break;
			}	
		},
		_calculateT0: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate t0
			var t0 = values['v']/values['q'];

			return t0;
		},
		_calculateDecayRate: function() {
			var $plugin = this;
			var values = $plugin._formValues;
			// calculate t0
			$plugin._activeValues['decayRate'] = 1 / values['t0'] + (values['k'] * values['factor'] * values['factor']);
			//console.log($plugin._activeValues);

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

			var multiplier = 1; // year
			if(values['timeType'] == 'week') {
				multiplier = 1/52;
			}
			if(values['timeType'] == 'day') {
				multiplier = 1/365;
			}
			var t = values['concentrationTime'] * multiplier;
			var calcResult = $plugin._lakeStep({t: t});	
			$plugin._activeValues['massTypeDisplay'] = 'mg/L';
			if(values['massType'] == 'Ci/day') {
				$plugin._activeValues['massTypeDisplay'] = 'mCi/L';
			}
			$('strong.calc-result').text($plugin._formatForDisplay(calcResult) + ' ' + values['massTypeDisplay']);
		},
		// _calculatedXMax: function() {
		// 	var $plugin = this;
		// 	var values = $plugin._activeValues;	

    //   // console.log("(w*e^(-b*x))/v");
    //   // y = 
    //   // console.log((values['w'] * Math.exp(-values['b'] * values)));
    //   // console.log("-(b*w*e^(-b*x))/v");
		// 	i = 0;
		// 	lakeStepIncrement = 0;
		// 	lakeStepTimeNumAuto = 0.1;
		
		// 	lakeStepY = $plugin._lakeStep({t: lakeStepIncrement});
		// 	lakeStepOldY = lakeStepY;
		// 	lakeStepOriginal = lakeStepY;
		// 	lakeStepCheckY = lakeStepOriginal / 100;
		// 	while (1) {
		// 		lakeStepIncrement += lakeStepTimeNumAuto / 10;
		// 		lakeStepY = $plugin._lakeStep({t: lakeStepIncrement});

		// 		//console.log(lakeStepIncrement);
		// 		if (lakeStepY > lakeStepOldY) {
		// 			if ((lakeStepY - lakeStepOldY) < (lakeStepY / 600)) {
		// 				return lakeStepIncrement;
		// 			}
		// 		}
		// 		if (i > 1000) {
		// 			return lakeStepIncrement;
		// 		}
		// 		i++;
		// 		lakeStepOldY = lakeStepY;
		// 	}
		// },
		_buildVaryTimeGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;	
			// derivative solved for x:
			// x = (log(w/(v y)))/b
			var Xmax = Math.log((values['v'] * 0.000000001) / values['w']) / -values['decayRate']
			Xmax = Math.abs(Xmax);
			// var Xmax = $plugin._calculatedXMax();		
			var Ymax = $plugin._lakeStep({t: Xmax});
			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.25, // y max
				Xmax * 1, // x max
				-Ymax * 0.1 // y min
			];
							
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingTimeBoard'] = JXG.JSXGraph.initBoard('varyingTimeGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._lakeStep({t: x});
			}], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']});
			$plugin._boards['varyingTimeBoard'].on('mousemove', function(e) {
				
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingTimeBoard');

				var x = coords.usrCoords[1];
				var y = $plugin._lakeStep({t: x});
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
			$('.x-axis-label.varyingTimeGraph').html('Time in years');
			
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
		_lakeStep: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// t should be in years
			t = points['t'];
			
			return (values['w'] * 1000000 * 365) / (values['decayRate'] * values['v'] * 1000) * (1 - Math.pow(Math.E, (-values['decayRate'] * t)));
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
	
	// then initialize lake step
	$('.lake-step-form').lake_step();
})(jQuery);
