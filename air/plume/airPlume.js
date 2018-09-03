;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'air_plume';
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
			a : '#BF6083',
			b : '#1197B4',
			c : '#A69F3F',
			d : '#D94F30',
			e : '#4d4698',
			f : '#8e3500'
		};
		// A = 213*x^0.894
		// B = 156*x^0.894
		// C = 104*x^0.894
		// D = 68*x^0.894
		// E = 50.50*x^0.894
		// F = 34*x^0.894
		this._sx = {
			a: 213,
			b: 156,
			c: 104,
			d: 68,			
			e: 50.50,
			f: 34
		};
		this.init();
	}
	Plugin.prototype = {
		init: function() {
			var $plugin = this;
			$plugin._loadFormValues();
							
			// determine what values we're actually using
			$plugin._setActiveValues();
			
			$plugin._calculateHR();

			// update view for hr method
			switch($plugin._activeValues['hrMethod']) {
				case 'calculated':
					$plugin._activeValues['hr'] = $plugin._activeValues['hrCalculated'];
					$('.hr-calculated').show();
					$('.hr-entered').hide();
				break;
				case 'entered':
					$plugin._activeValues['hr'] = $plugin._activeValues['hrEntered'];
					$('.hr-calculated').hide();
					$('.hr-entered').show();
				break;
			}
			
			$('.verify .hrCalculated').text($plugin._formatForDisplay($plugin._activeValues['hrCalculated']));
			
			
			$plugin._updateCalculatedConcentration();

			// plot
			//$plugin._buildDispHorizontalGraph();
			$plugin._buildSYGraph();
			$plugin._buildSZGraph();
			$plugin._buildVaryYGraph();
			$plugin._buildVaryZGraph();
			
			// call ourself if something changes
			$('.airPlume').off('change', 'input,select');
			$('.airPlume').on('change', 'input,select', function() {
				$plugin.init();
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'AirPlume'}, 'AirPlume', currentState.toString());
			});
			$('input.u').on('blur', function(e){
				var u_value = $(this).val();
				$('input.u').val(u_value);
			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				hrMethod : $('select.hrMethod').val(),
				hrEntered : Number($('input.hrEntered').val()),
				hri : Number($('input.hri').val()),
				us : Number($('input.us').val()),
				u : Number($('input.u').val()),
				d : Number($('input.d').val()),
				p : Number($('input.p').val()),
				ts : Number($('input.ts').val()),
				ta : Number($('input.ta').val()),
				as : $('select.as').val(),
				qm : Number($('input.qm').val()),
				dz : Number($('input.dz').val()),
				dx : Number($('input.dx').val()),
				dist : Number($('input.dist').val()),
				concentrationY : Number($('input.concentrationY').val()),
				concentrationZ : Number($('input.concentrationZ').val()),
				graphY : Number($('input.graphY').val()),
				graphZ : Number($('input.graphZ').val()),
				increments : {
					'year': 1, //365 * 24 * 60 * 60,
					'day': 365, //24 * 60 * 60,
					'hour': 8760, //60 * 60,
					'minute': 525600, //60
				}
			};

			//console.log($plugin._formValues)
		},
		_setActiveValues: function() {
			var $plugin = this;
			// default to the form values
			$plugin._activeValues = $plugin._formValues;
			// determine which E value to use
			switch($('select.hrMethod').val()) {
				case 'calculated':
					$plugin._activeValues['hr'] = $plugin._calculated['hrCalculated'];
				break;
				case 'entered':
					$plugin._activeValues['hr'] = $plugin._formValues['hrEntered'];
				break;
			}	
		},
		_calculateHR: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// calculate t0
			$plugin._activeValues['hrCalculated'] = values['hri'] + (values['us'] * values['d']/values['u']) * (1.5 + 2.68 * Math.pow(10, -3) * values['p'] * values['d'] * ((values['ts'] - values['ta'])/values['ts']));
		},
		_calculateSX: function(x, stability) {
			return stability * Math.pow(x,0.894);
		},
		_calculateSZ: function(x, stability) {
			var $plugin = this;
			var values = $plugin._activeValues;
			var tempA = 0;
			var tempB = 0
			
			if (stability == "a") {
				if (x > 3.11) {
					return 5000;
				}
				if(x <= 3.11 && x > 0.5) {
					tempA = 453.85;
					tempB = 2.1166;
				}
				if(x <= 0.5 && x > 0.4) {
					tempA = 346.74;
					tempB = 1.7283;
				}
				if(x <= 0.4 && x > 0.3) {
					tempA = 258.89;
					tempB = 1.4094;
				}
				if(x <= 0.3 && x > 0.25) {
					tempA = 217.41;
					tempB = 1.2644;
				}
				if(x <= 0.25 && x > 0.2) {
					tempA = 179.52;
					tempB = 1.1262;
				}
				if(x <= 0.2 && x > 0.15) {
					tempA = 170.22;
					tempB = 1.0932;
				}
				if(x <= 0.15 && x > 0.1) {
					tempA = 158.08;
					tempB = 1.0542;
				}
				if(x <= 0.1) {
					tempA = 122.8;
					tempB = 0.9447;
				}
			}
			if (stability == "b") {
				if(x > 35) {
					return 5000;
				}
				if(x <= 35 && x > 0.4) {
					tempA = 109.30;
					tempB = 1.0971;
				}
				if(x <= 0.4 && x > 0.2) {
					tempA = 98.483;
					tempB = 0.98332;
				}
				if(x <= 0.2) {
					tempA = 90.673;
					tempB = 0.93198;
				}
			}
			if (stability == "c") {
				tempA = 61.141;
				tempB = 0.91465
			}
	
			if (stability == "d") {
				if(x > 30) {
					tempA = 44.053;
					tempB = 0.51179;
				}
				if(x <= 30 && x > 10) {
					tempA = 36.650;
					tempB = 0.56589;
				}
				if(x <= 10 && x > 3) {
					tempA = 33.504;
					tempB = 0.60486;
				}
				if(x <= 3 && x > 1) {
					tempA = 32.093;
					tempB = 0.64403;
				}
				if(x <= 1 && x > 0.3) {
					tempA = 32.093;
					tempB = 0.81066;
				}
				if(x <= 0.3) {
					tempA = 34.459;
					tempB = 0.86974;
				}
			}
			if (stability == "e") {
				if(x > 40) {
					tempA = 47.618;
					tempB = 0.2992;
				}
				if(x <= 40 && x >20) {
					tempA = 35.420;
					tempB = 0.37615;
				}
				if(x <= 40 && x >20) {
					tempA = 35.420;
					tempB = 0.37615;
				}
				if(x <= 20 && x >10) {
					tempA = 26.970;
					tempB = 0.46713;
				}
				if(x <= 10 && x >4) {
					tempA = 24.703;
					tempB = 0.50527;
				}
				if(x <= 4 && x >2) {
					tempA = 22.534;
					tempB = 0.57154;
				}
				if(x <= 2 && x >1) {
					tempA = 21.628;
					tempB = 0.63077;
				}
				if(x <= 1 && x >0.3) {
					tempA = 21.628;
					tempB = 0.75660;
				}
				if(x <= 0.3 && x >0.1) {
					tempA = 23.331;
					tempB = 0.81956;
				}
				if(x <= 0.1) {
					tempA = 24.260;
					tempB = 0.83660;
				}
		
			}
				if (stability == "f") {
				if(x > 60) {
					tempA = 34.219;
					tempB = 0.21716;
				}
				if(x <= 60 && x >30) {
					tempA = 27.074;
					tempB = 0.27436;
				}
				if(x <= 30 && x >15) {
					tempA = 22.651;
					tempB = 0.32681;
				}
				if(x <= 15 && x >7) {
					tempA = 17.836;
					tempB = 0.4150;
				}
				if(x <= 7 && x >3) {
					tempA = 16.187;
					tempB = 0.4649;
				}
				if(x <= 3 && x >2) {
					tempA = 14.823;
					tempB = 0.54503;
				}
				if(x <= 2 && x >1) {
					tempA = 13.953;
					tempB = 0.63227;
				}
				if(x <= 1 && x >0.7) {
					tempA = 13.953;
					tempB = 0.68465;
				}
				if(x <= 0.7 && x >0.2) {
					tempA = 14.457;
					tempB = 0.78407;
				}
				if(x <= 0.2) {
					tempA = 15.209;
					tempB = 0.81558;
				}
			}
			//console.log(tempA, tempB, x, stability);
			return tempA * Math.pow(x, tempB);			
		},
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// update the calculated point value

			var x = values['concentrationY'];
			var z = values['concentrationZ'];
			var calcResult = $plugin._airPlume({x: x, z: z});
			
			$('strong.calc-result').text($plugin._formatForDisplay(calcResult));
		},
		_buildSYGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			var boundingBox = [
				0, // x min
				5.5, // y max
				3.5, // x max
				0 // y min
			];

			JXG.Options.text.useMathJax = true;
			$plugin._boards['SXBoard'] = JXG.JSXGraph.initBoard('SXGraph', { 
				axis:false, 
				showCopyright:false,
				boundingBox: boundingBox,
				showNavigation: false,
			});

			// use logarithmic axis scale (not really supported, but documented)
			// http://www.intmath.com/cg3/jsxgraph-coding-summary.php
			var x, ticksX, ticksY, p, f1, f2, f3, xAxis, yAxis, pre, post, functions = {}, plots = {};
			board = $plugin._boards['SXBoard'];
			xAxis = board.create('line', [[0, 0], [1, 0]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1,
				fixed: true
			}); 
			yAxis = board.create('line', [[0, 0], [0, 1]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1, 
				fixed: true
			});
			ticksX = board.create('ticks', [xAxis, 1], {
				drawLabels: true,
				drawZero: false,
				 generateLabelText: function (tick, zero) {
					 return (Math.round(Math.pow(10, tick.usrCoords[1] - 1) * 100)/100).toString();
				 }
			});
			ticksY = board.create('ticks', [yAxis, 1], {
				drawLabels: true,
				// Show the tick marker at zero (or, in this case: 1)
				drawZero: false,
				generateLabelText: function (tick, zero) {
					return Math.round(Math.pow(10, tick.usrCoords[2])).toString();
				}
			});	
			for(var i = 1; i < 6; i++) {
				board.create('line', [[i, 0], [i, 1]], {
					strokeColor: '#ccc', 
					highlightStrokeColor: '#ccc',
					strokeWidth: 1,
					highlightStrokeWidth: 1,
					fixed: true
				}); 
				board.create('line', [[0, i], [1, i]], {
					strokeColor: '#ccc', 
					highlightStrokeColor: '#ccc',
					strokeWidth: 1,
					highlightStrokeWidth: 1,
					fixed: true
				});
			}
			// overwrite the contents of the default infobox.
			board.highlightInfobox = function (x, y, el) {
				board.infobox.setText('');
			};
			pre = function (x) {
				return Math.pow(10, x);
			};
			post = function (x) {
				return Math.log(x) / Math.LN10;
			};
			var i = 1;
			for(var _stability in $plugin._sx) {
				// note that you have to wrap functions created in loops with an anonymous function so that values get copied, otherwise, clicking collapses the lines
				// https://groups.google.com/forum/#!msg/jsxgraph/3QUMWmJJSwg/URZenNuH4vsJ
				(function(stability) {
					functions[stability] = function(x) { 
						//return i + Math.exp(x);
						return $plugin._calculateSX(x, $plugin._sx[stability]);
					};
					plots[stability] = board.create('functiongraph', [function (x) {
						return post(functions[stability](pre(x)));
					}, 0, 10], {
						name: stability.toUpperCase(),
						withLabel: true,
						strokeColor: $plugin._colors[stability],
						highlightStrokeColor: $plugin._colors[stability],
						showInfobox: false,
						needsRegularUpdate: true
					});
				})(_stability);
				i++;
				
				//console.log(plots);
			}
			
						
			$plugin._boards['SXBoard'].on('mousemove', function(e) {		
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'SXBoard');
				var x = pre(coords.usrCoords[1]);
				
				for(var stability in $plugin._sx) {
					var y = $plugin._calculateSX(x, $plugin._sx[stability]);
					if($plugin._points['SXPoint' + stability] != undefined) {
						$plugin._points['SXPoint' + stability].remove();
					}
					$plugin._points['SXPoint' + stability] = $plugin._boards['SXBoard'].create('point', [post(x), post(y)], {
						strokeWidth: 1,
						withLabel: false,
						fillColor:  $plugin._colors[stability],
						strokeColor:  $plugin._colors[stability],
						showInfobox: false,
						dash:2
					});
					$plugin._points['SXPoint' + stability].clearTrace();
					
					$('.SXGraph.' + stability + '-value').html(stability.toUpperCase() + ':<br/>(' + $plugin._formatForDisplay(Math.pow(10, post(x)-1)) + ', ' + $plugin._formatForDisplay(y) + ')');

				}
			});
			
			// labels
			$('.y-axis-label.SXGraph').html('&sigma;<sub>y</sub>, meter (&sigma;<sub>y</sub> = &sigma;<sub>x</sub>)');
			$('.x-axis-label.SXGraph').html('Distance downwind, km');
			
		},
		_buildSZGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			var boundingBox = [
				0, // x min
				5.5, // y max
				3.5, // x max
				0 // y min
			];

			JXG.Options.text.useMathJax = true;
			$plugin._boards['SZBoard'] = JXG.JSXGraph.initBoard('SZGraph', { 
				axis:false, 
				showCopyright:false,
				boundingBox: boundingBox,
				showNavigation: false,
			});

			// use logarithmic axis scale (not really supported, but documented)
			// http://www.intmath.com/cg3/jsxgraph-coding-summary.php
			var x, ticksX, ticksY, p, f1, f2, f3, xAxis, yAxis, pre, post, functions = {}, plots = {};
			board = $plugin._boards['SZBoard'];
			xAxis = board.create('line', [[0, 0], [1, 0]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1,
				fixed: true
			}); 
			yAxis = board.create('line', [[0, 0], [0, 1]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1, 
				fixed: true
			});
			ticksX = board.create('ticks', [xAxis, 1], {
				drawLabels: true,
				drawZero: false,
				 generateLabelText: function (tick, zero) {
					 return (Math.round(Math.pow(10, tick.usrCoords[1] - 1) * 100)/100).toString();
				 }
			});
			ticksY = board.create('ticks', [yAxis, 1], {
				drawLabels: true,
				// Show the tick marker at zero (or, in this case: 1)
				drawZero: false,
				generateLabelText: function (tick, zero) {
					return Math.round(Math.pow(10, tick.usrCoords[2])).toString();
				}
			});	
			for(var i = 1; i < 6; i++) {
				board.create('line', [[i, 0], [i, 1]], {
					strokeColor: '#ccc', 
					highlightStrokeColor: '#ccc',
					strokeWidth: 1,
					highlightStrokeWidth: 1,
					fixed: true
				}); 
				board.create('line', [[0, i], [1, i]], {
					strokeColor: '#ccc', 
					highlightStrokeColor: '#ccc',
					strokeWidth: 1,
					highlightStrokeWidth: 1,
					fixed: true
				});
			}
			// overwrite the contents of the default infobox.
			board.highlightInfobox = function (x, y, el) {
				board.infobox.setText('');
			};
			pre = function (x) {
				return Math.pow(10, x);
			};
			post = function (x) {
				return Math.log(x) / Math.LN10;
			};
			var i = 1;
			for(var _stability in $plugin._sx) {
				// note that you have to wrap functions created in loops with an anonymous function so that values get copied, otherwise, clicking collapses the lines
				// https://groups.google.com/forum/#!msg/jsxgraph/3QUMWmJJSwg/URZenNuH4vsJ
				(function(stability) {
					functions[stability] = function(x) { 
						//return i + Math.exp(x);
						//console.log(stability, x, pre(x), post(x), $plugin._calculateSZ(post(x), stability));
						return $plugin._calculateSZ(Math.pow(10, post(x)-1), stability);
					};
					plots[stability] = board.create('functiongraph', [function (x) {
						return post(functions[stability](pre(x)));
					}, 0, 10], {
						name: stability.toUpperCase(),
						withLabel: true,
						strokeColor: $plugin._colors[stability],
						highlightStrokeColor: $plugin._colors[stability],
						showInfobox: false,
						needsRegularUpdate: true
					});
				})(_stability);
				i++;
			}
						
			$plugin._boards['SZBoard'].on('mousemove', function(e) {		
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'SZBoard');
				var x = pre(coords.usrCoords[1]);
				
				for(var stability in $plugin._sx) {
	
					var y = $plugin._calculateSZ(Math.pow(10, post(x)-1), stability);
					if($plugin._points['SZPoint' + stability] != undefined) {
						$plugin._points['SZPoint' + stability].remove();
					}
					$plugin._points['SZPoint' + stability] = $plugin._boards['SZBoard'].create('point', [post(x), post(y)], {
						strokeWidth: 1,
						withLabel: false,
						fillColor:  $plugin._colors[stability],
						strokeColor:  $plugin._colors[stability],
						showInfobox: false,
						dash:2
					});
					$plugin._points['SZPoint' + stability].clearTrace();
					$('.SZGraph.' + stability + '-value').html(stability.toUpperCase() + ':<br />(' + $plugin._formatForDisplay(Math.pow(10, post(x)-1)) + ', ' + $plugin._formatForDisplay(y) + ')');
					//console.log(stability, x, pre(x), post(x), $plugin._calculateSZ(post(x), stability));
				}
			});
			
			// labels
			$('.y-axis-label.SZGraph').html('&sigma;<sub>z</sub>, meter');
			$('.x-axis-label.SZGraph').html('Distance downwind, km');
			
		},
		_buildVaryYGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;	
			var Xmax = 10 * values['graphZ'];		
			var Ymax = $plugin._airPlume({x: 0, z: values['graphZ']});
			var Ymin = $plugin._airPlume({x: Xmax, z: values['graphZ']});
			var Xmin = -Xmax;
			// JSXGraph can't graph, and hangs the page if our plot is too tiny
			if (Ymax < 1e-15) {
			  Ymax = 1e-10;
			}
			if (Ymin < 1e-15) {
			  Ymin = 1e-10;
			}
			var boundingBox = [
				Xmin, // x min
				Ymax * 1.001, // y max
				Xmax, // x max
				Ymin // y min
			];
			//console.log(boundingBox);
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingYBoard'] = JXG.JSXGraph.initBoard('varyingYGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingYBoard'].create('functiongraph', [function(x) {
				return $plugin._airPlume({x: x, z: values['graphZ']});
			}], {strokeColor: $plugin._colors['a'], highlightStrokeColor: $plugin._colors['a']});
			var xAxis = $plugin._boards['varyingYBoard'].create('line', [[Xmin, Ymax], [Xmax, Ymax]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1,
				fixed: true
			});
			var ticksX = board.create('ticks', [xAxis, 10], {
				drawLabels: true,
				drawZero: false,
				 generateLabelText: function (tick, zero) {		 	
					 return (Math.round(tick.usrCoords[1])).toString();
				 }
			});
			//console.log(xAxis);
			$plugin._boards['varyingYBoard'].on('mousemove', function(e) {
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingYBoard');

				var x = coords.usrCoords[1];
				var y = $plugin._airPlume({x: x, z: values['graphZ']});
				if($plugin._points['varyingYPoint'] != undefined) {
					$plugin._points['varyingYPoint'].remove();
				}
				$plugin._points['varyingYPoint'] = $plugin._boards['varyingYBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, showInfobox: false});
				$plugin._points['varyingYPoint'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingYPoint'].setLabelText('(' + x + ', ' + y + ')');
			});
			// labels
			$('.y-axis-label.varyingYGraph').html('Concentration in g/m<sup>3</sup>');
			$('.x-axis-label.varyingYGraph').html('Distance in meters left or right of source');
			
		},
		_buildVaryZGraph: function() {
			var $plugin = this;
			var values = $plugin._activeValues;	
			var Xmax = 10 * values['graphY'];		
			var Ymax = $plugin._airPlume({x: values['graphY'], z: 0});
			var Ymin = $plugin._airPlume({x: values['graphZ'], z: Xmax});
			var Xmin = -Xmax;
			// JSXGraph can't graph, and hangs the page if our plot is too tiny
			if (Ymax < 1e-15) {
			  Ymax = 1e-10;
			}
			if (Ymin < 1e-15) {
			  Ymin = 1e-10;
			}
			var boundingBox = [
				Xmin, // x min
				Ymax, // y max
				Xmax, // x max
				Ymin // y min
			];
			//console.log(boundingBox);
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingZBoard'] = JXG.JSXGraph.initBoard('varyingZGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingZBoard'].create('functiongraph', [function(x) {
				return $plugin._airPlume({x: values['graphZ'], z: x});
			}], {strokeColor: $plugin._colors['a'], highlightStrokeColor: $plugin._colors['a']});
			var xAxis = $plugin._boards['varyingZBoard'].create('line', [[Xmin, Ymax - (0.1 * (Ymax - Ymin))], [Xmax, Ymax - (0.1 * (Ymax - Ymin))]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1,
				fixed: true
			});
			var ticksX = board.create('ticks', [xAxis, 10], {
				drawLabels: true,
				drawZero: false,
				 generateLabelText: function (tick, zero) {		 	
					 return (Math.round(tick.usrCoords[1])).toString();
				 }
			});
			$plugin._boards['varyingZBoard'].on('mousemove', function(e) {
				
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'varyingZBoard');

				var x = coords.usrCoords[1];
				var y = $plugin._airPlume({x: values['graphZ'], z: x});
				if($plugin._points['varyingZPoint'] != undefined) {
					$plugin._points['varyingZPoint'].remove();
				}
				$plugin._points['varyingZPoint'] = $plugin._boards['varyingZBoard'].create('point', [x, y], {strokeWidth: 1, dash:2, showInfobox: false});
				$plugin._points['varyingZPoint'].clearTrace();
				x = $plugin._formatForDisplay(x);
				y = $plugin._formatForDisplay(y);
		
				$plugin._points['varyingZPoint'].setLabelText('(' + x + ', ' + y + ')');
			});
			// labels
			$('.y-axis-label.varyingZGraph').html('Concentration in g/m<sup>3</sup>');
			$('.x-axis-label.varyingZGraph').html('Distance in meters up or down from source');
			
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

			if((x < 0.01 && x > 0) || (x > -0.01 && x < 0) || x > 900000 || x < -90000)   {
				x = x.toExponential(3);
				//x = x;
			}
			else {
				x = Math.round(x * 1000) / 1000; 
			}
			return x;
		},
		_airPlume: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// t should be in years
			y = points['x'];
			z = points['z'];
			
			return values['qm'] / (2 * Math.PI * values['dx'] * values['dz'] * values['u']) * Math.pow(Math.E, (-0.5 * Math.pow(( y /values['dx']), 2))) * (Math.pow(Math.E, -0.5 * Math.pow((z - values['hr']) / values['dz'], 2)) + Math.pow(Math.E, -0.5 * Math.pow((z + values['hr']) / values['dz'], 2)));	
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
	
	// then initialize air plume
	$('.air-plume-form').air_plume();
})(jQuery);
