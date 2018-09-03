;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'river_pulse';
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
			$('span.eCalculated').text(Math.round($plugin._calculated['e'] * 100) / 100);
						
			// determine what values we're actually using
			$plugin._setActiveValues();
			
			$('.verify .m').text(Math.round($plugin._activeValues['m'] * 100) / 100);
			$('.verify .w').text(Math.round($plugin._activeValues['w'] * 100) / 100);
			$('.verify .d').text(Math.round($plugin._activeValues['d'] * 100) / 100);
			$('.verify .v').text(Math.round($plugin._activeValues['v'] * 100) / 100);
			$('.verify .e').text(Math.round($plugin._activeValues['e'] * 100) / 100);
			$plugin._calculateK();
			var kInPerMinute = $plugin._activeValues['k'] * 60;
			$('.verify .k').text($plugin._formatForDisplay(kInPerMinute));
			$('.verify .massType').text($plugin._activeValues['massType']);
			$('div.rateConstantCalcNum').text($plugin._formatForDisplay($plugin._activeValues['rateConstantCalcNum']) + ' /' + $plugin._activeValues['halfLifeIncrement']);
			
			$plugin._updateCalculatedConcentration();

			// plot
			$plugin._buildVaryTimeGraph();
			$plugin._buildVaryDistanceGraph();
			$plugin._buildVaryDistanceAndTimeGraph();
			
			// call ourself if something changes
			$('.riverPulse').off('change', 'input,select');
			$('.riverPulse').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'RiverPulse'}, 'RiverPulse', currentState.toString());
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
				m : Number($('input.m').val()),
				massType : $('select.massType').val(),
				halfLife : Number($('input.halfLife').val()),
				graphDistanceVaryTime : Number($('input.graphDistanceVaryTime').val()),
				graphTimeVaryDistance : Number($('input.graphTimeVaryDistance').val()),
				timeOne : Number($('input.timeOne').val()),
				timeTwo : Number($('input.timeTwo').val()),
				timeThree : Number($('input.timeThree').val()),
				timeFour : Number($('input.timeFour').val()),
				concentrationDistance : Number($('input.concentrationDistance').val()),
				concentrationTime : Number($('input.concentrationTime').val()),
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
			var calcResult = $plugin._riverPulse({t: values['concentrationTime'], d: values['concentrationDistance']});
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
			var d = values['graphDistanceVaryTime'] * 1000;
			var Xmax = (-2* values['e'] +2*Math.sqrt(Math.pow(values['e'], 2)+Math.pow(d, 2)*Math.pow(values['v'], 2) + 4*Math.pow(d,2)*values['k']/60*values['e'])) / (2*(Math.pow(values['v'], 2) +4*values['k']/60* values['e']));
			
			// adjust from seconds to hours
			Xmax = (Xmax/3600);
					
			var Ymax = $plugin._riverPulse({t: Xmax, d: values['graphDistanceVaryTime']});

			var boundingBox = [
				-Xmax * 0.1, // x min
				Ymax * 1.25, // y max
				Xmax * 2.5, // x max
				-Ymax * 0.1 // y min
			];
				
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingTimeBoard'] = JXG.JSXGraph.initBoard('varyingTimeGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: x, d: values['graphDistanceVaryTime']});
			},0], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: x, d: values['graphDistanceVaryTime']});
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
			$('.x-axis-label.varyingTimeGraph').html('Time in hours');
			
		},
		_buildVaryDistanceGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// determine what to show in the graph

			var Xmax = (values['v'] * values['graphTimeVaryDistance'] * 3600) / 1000;
			
			// http://www.derivative-calculator.net/#expr=%28m%2F%28w%2Ad%2Asqrt%284%2Api%2Az%2At%29%29%29%2Ae%5E%28-%28%28x-v%2At%29%5E2%2F%284%2Az%2At%29%29-%28k%2At%29%29&calcroots=1
			// https://cloud.sagemath.com/projects/b28e080c-2af4-48d4-a1a0-34948b92e774/files/RiverPulseVaryDistance.sagews
			
			
			var t = values['graphTimeVaryDistance'];
			var Ymax = $plugin._riverPulse({d: Xmax, t: t});
			//console.log(Xmax, Ymax);

			var boundingBox = [
				-Xmax * 0.01, // x min
				Ymax * 1.5, // y max
				Xmax * 2, // x max
				-Ymax * 0.25 // y min
			];
			
			//var boundingBox = [-1, 0.001, 36, -0.001]

			JXG.Options.text.useMathJax = true;

			$plugin._boards['varyingDistanceBoard'] = JXG.JSXGraph.initBoard('varyingDistanceGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});
			$plugin._boards['varyingDistanceBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: values['graphTimeVaryDistance'], d: x});
			},0], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor: $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: values['graphTimeVaryDistance'], d: x});
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
			$('.x-axis-label.varyingDistanceGraph').html('Distance in Kilometers');
			
		},
		
		_buildVaryDistanceAndTimeGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// determine what to show in the graph
			var t = Math.max(values['timeOne'], values['timeTwo'], values['timeThree'], values['timeFour']);
			var Xmax = (values['v'] * t * 3600) / 1000;	
			var Ymax = $plugin._riverPulse({d: Xmax, t: t});

			var boundingBox = [
				-0.05, // x min
				Ymax * 3, // y max
				Xmax * 2, // x max
				-0.001 // y min
			];
			
			JXG.Options.text.useMathJax = true;

			$plugin._boards['varyingDistanceAndTimeBoard'] = JXG.JSXGraph.initBoard('varyingDistanceAndTimeGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});
			$plugin._boards['varyingDistanceAndTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: values['timeOne'], d: x});
			},0], {strokeColor: $plugin._colors['timeOne'], highlightStrokeColor: $plugin._colors['timeOne']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceAndTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: values['timeOne'], d: x});
				if($plugin._points['varyingDistanceAndTimePointOne'] != undefined) {
					$plugin._points['varyingDistanceAndTimePointOne'].remove();
				}
				$plugin._points['varyingDistanceAndTimePointOne'] = $plugin._boards['varyingDistanceAndTimeBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, fillColor:  $plugin._colors['timeOne'], strokeColor:  $plugin._colors['timeOne'], showInfobox: false});
				$plugin._points['varyingDistanceAndTimePointOne'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingDistanceAndTimePointOne'].setLabelText('(' + x + ', ' + y + ')');
				$('.concentrations .one strong').text(y);
				
				$('.concentrations .distance strong').text(x);
			});
			$plugin._boards['varyingDistanceAndTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: values['timeTwo'], d: x});
			},0], {strokeColor: $plugin._colors['timeTwo'], highlightStrokeColor:  $plugin._colors['timeTwo']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceAndTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: values['timeTwo'], d: x});
				if($plugin._points['varyingDistanceAndTimePointTwo'] != undefined) {
					$plugin._points['varyingDistanceAndTimePointTwo'].remove();
				}
				$plugin._points['varyingDistanceAndTimePointTwo'] = $plugin._boards['varyingDistanceAndTimeBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, fillColor:  $plugin._colors['timeTwo'], strokeColor:  $plugin._colors['timeTwo'], showInfobox: false});
				$plugin._points['varyingDistanceAndTimePointTwo'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingDistanceAndTimePointTwo'].setLabelText('(' + x + ', ' + y + ')');
				$('.concentrations .two strong').text(y);
			});
			$plugin._boards['varyingDistanceAndTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: values['timeThree'], d: x});
			},0], {strokeColor:  $plugin._colors['timeThree'], highlightStrokeColor:  $plugin._colors['timeThree']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceAndTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: values['timeThree'], d: x});
				if($plugin._points['varyingDistanceAndTimePointThree'] != undefined) {
					$plugin._points['varyingDistanceAndTimePointThree'].remove();
				}
				$plugin._points['varyingDistanceAndTimePointThree'] = $plugin._boards['varyingDistanceAndTimeBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, fillColor:  $plugin._colors['timeThree'], strokeColor:  $plugin._colors['timeThree'], showInfobox: false});
				$plugin._points['varyingDistanceAndTimePointThree'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingDistanceAndTimePointThree'].setLabelText('(' + x + ', ' + y + ')');
				$('.concentrations .three strong').text(y);
			});
			$plugin._boards['varyingDistanceAndTimeBoard'].create('functiongraph', [function(x) {
				return $plugin._riverPulse({t: values['timeFour'], d: x});
			},0], {strokeColor:  $plugin._colors['timeFour'], highlightStrokeColor:  $plugin._colors['timeFour']})
				.on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingDistanceAndTimeBoard');
				var x = coords.usrCoords[1];
				var y = $plugin._riverPulse({t: values['timeFour'], d: x});
				if($plugin._points['varyingDistanceAndTimePointFour'] != undefined) {
					$plugin._points['varyingDistanceAndTimePointFour'].remove();
				}
				$plugin._points['varyingDistanceAndTimePointFour'] = $plugin._boards['varyingDistanceAndTimeBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, fillColor:  $plugin._colors['timeFour'], strokeColor:  $plugin._colors['timeFour'], showInfobox: false});
				$plugin._points['varyingDistanceAndTimePointFour'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingDistanceAndTimePointFour'].setLabelText('(' + x + ', ' + y + ')');
				$('.concentrations .four strong').text(y);
			});
			// labels
			$('.y-axis-label.varyingDistanceAndTimeGraph').html('Concentration in ' + values['massTypeDisplay']);
			$('.x-axis-label.varyingDistanceAndTimeGraph').html('Distance in Kilometers');
			/*
			$plugin._boards['varyingDistanceAndTimeBoard'].create('axis', [[0, 0], [1,0]], 
				{name:'Distance in Km', 
				withLabel: true,
				label: {
					position: 'top',  // possible values are 'lft', 'rt', 'top', 'bot'
					offset: [50, 10]  // (in pixels)
				}
			});
			$plugin._boards['varyingDistanceAndTimeBoard'].create('axis', [[0, 0], [0,1]], 
				{name:'Concentration in ' + values['massTypeDisplay'], 
				withLabel: true
				//label: {
					//position: 'rt',  // possible values are 'lft', 'rt', 'top', 'bot'
				//	offset: [50, 10],  // (in pixels)
			//		rotate: 90
			//	}
			});
			*/
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
		_riverPulse: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// d should be in Km
			// t should be in hours
			
			t = points['t'];
			d = points['d'];
			
			//console.log(values, d, t);
			//console.log(values['m'], values['w'], values['d'], values['e'], t);
			//console.log( values['m'] / ((values['w'] * values['d'])	* Math.sqrt(4 * Math.PI * values['e'] * (t * 60 * 60))));
			// t is in hours
			// d is in Km
			// http://www.wolframalpha.com/input/?i=1%2F%2840*2*sqrt%284*pi*49.67*3.5*3600%29%29*2.718%5E-%28%287-0.5*3.5*3600%29%5E2%2F%284*49.67*3.5*3600%29-%286.4*10%5E-7*3.5%2F60%29
			// modified to match FATE
			var value_in_grams = values['m'] / ((values['w'] * values['d'])	* Math.sqrt(4 * Math.PI * values['e'] * (t * 60 * 60))) * Math.pow(Math.E, -((Math.pow(d * 1000 - values['v'] * (t * 60 * 60), 2)))/(4 * values['e'] * t * 60 * 60) - (values['k'] * t / 60));
			var value_in_mg = value_in_grams * 1000;
			return value_in_mg;
			
			// Potentially correct
			//return (values['m'] / (values['w'] * values['d'] * Math.sqrt(4 * Math.PI * values['e'] * t))) * Math.pow(Math.E, -(((Math.pow(d - values['v'] * t, 2))/(4 * values['e'] * t)) - (values['k']/60 * t))); 
			// from FATE		
			//_root.instantaneousEquation = riverPulseMassNum + "/((" + riverPulseWidthNum + "*" + dNum + ")*sqrt(4*PI*" + riverPulseEddyDisplay + "*" + Time + "))*E^(-((x-" + riverPulseVelocityNum + "*" + Time + ")^2)/(4*" + riverPulseEddyDisplay + "*" + Time + ")-(" + riverPulseRateConstantDisplay + ")/60*" + Time + ")";
			// take note, useful for online derivative calculations (z replaces Eddy), this is for x = distance
			// http://www.derivative-calculator.net/#expr=%28m%2F%28w%2Ad%2Asqrt%284%2Api%2Az%2At%29%29%29%2Ae%5E%28-%28%28x-v%2At%29%5E2%2F%284%2Az%2At%29%29-%28k%2At%29%29
			// (m/(w*d*sqrt(4*pi*z*t)))*e^(-((x-v*t)^2/(4*z*t))-(k*t))
			// or maybe:
			// http://www.derivative-calculator.net/#expr=%28m%2F%28w%2Ad%2Asqrt%284%2Api%2Az%2At%2A3600%29%29%29%2Ae%5E%28-%28%28x%2A1000-v%2At%29%5E2%2F%284%2Az%2At%2A3600%29%29-%28k%2At%2F60%29%29
			// (m/(w*d*sqrt(4*pi*z*t*3600)))*e^(-((x*1000-v*t)^2/(4*z*t*3600))-(k*t/60))
			
			// use this for x = time (p replaces distance)
			// http://www.derivative-calculator.net/#expr=%28m%2F%28w%2Ad%2Asqrt%284%2Api%2Az%2Ax%29%29%29%2Ae%5E%28-%28%28p-v%2Ax%29%5E2%2F%284%2Az%2Ax%29%29-%28k%2Ax%29%29
			// (m/(w*d*sqrt(4*pi*z*x)))*e^(-((p-v*x)^2/(4*z*x))-(k*x))
			// or maybe:
			// http://www.derivative-calculator.net/#expr=%28m%2F%28w%2Ad%2Asqrt%284%2Api%2Az%2Ax%2A3600%29%29%29%2Ae%5E%28-%28%28p%2A1000-v%2Ax%29%5E2%2F%284%2Az%2Ax%2A3600%29%29-%28k%2Ax%2F60%29%29
			// (m/(w*d*sqrt(4*pi*z*x*3600)))*e^(-((p*1000-v*x)^2/(4*z*x*3600))-(k*x/60))
			

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
	$('.river-pulse-form').river_pulse();
})(jQuery);
