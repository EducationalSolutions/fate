// TODO: Changing Qt = 1000, u = 8, Hr = 40 at the top of the page
// causes the site to crash if either buildVary function is called

;(function ( $, JXG, window, document, undefined ) {
	var pluginName = 'air_puff';
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
			a: 0.32,
			b: 0.32,
			c: 0.22,
			d: 0.16,			
			e: 0.11,
			f: 0.11
		};
		this.init(false);
	}
	Plugin.prototype = {
		init: function(replot) {
      replot = true;
			var $plugin = this;
			$plugin._loadFormValues();
							
			// determine what values we're actually using
			$plugin._setActiveValues();
			
			$plugin._calculateT();
		
			$('.verify .t').text($plugin._formatForDisplay($plugin._activeValues['t']));
			
			$plugin._updateCalculatedConcentration();

			// plot
			//$plugin._buildDispHorizontalGraph();
      $plugin._buildSYGraph();
      $plugin._buildSZGraph();
      if(replot) {
        $plugin._buildVaryYGraph();
        $plugin._buildVaryZGraph();
      } 			
			// call ourself if something changes
			$('.airPuff').off('change', 'input,select');
			$('.airPuff').on('change', 'input,select', function() {
				$plugin.init(false);
				// then update the url so we don't lose our place
				//console.log($plugin._activeValues);
				var currentState = URI(window.location);
				currentState.setSearch($plugin._activeValues);
				history.pushState({id: 'AirPuff'}, 'AirPuff', currentState);
			});
// 			$('.update-plots').on('click', function(e) {
// 			  e.preventDefault();
// 			  $plugin._buildVaryYGraph();
//         $plugin._buildVaryZGraph();
// 			});
			//console.log($plugin);
		},
		_loadFormValues: function() {
			var $plugin = this;
			$plugin._formValues = {
				hr : Number($('input.hr').val()),				
				u : Number($('input.u').val()),
				as : $('select.as').val(),
				qt : Number($('input.qt').val()),
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
			
		},
		_calculateT: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
		
			$plugin._activeValues['t'] = values['dist'] / values['u'];
		},
		_calculateSX: function(x, stability) {
			
			switch(stability) {
				case 'a':
					// Y = 0.1432(X^0.922)
					return (0.1432 * Math.pow(x, 0.922));
					return (83.5629 * Math.pow(x, 0.922)); 
				break;
				case 'c':
					// Y = 0.0573(X^0.922)
					return 0.0573 * Math.pow(x, 0.922); 
					return 33.4252 * Math.pow(x, 0.922); 
				break;
				case 'e':
					// Y = 0.0213(X^0.8927) 
					return 0.0213 * Math.pow(x, 0.8927);
					return 10.1536 * Math.pow(x, 0.8927); 		
				break;
			}
		},
		_calculateSZ: function(x, stability) {
			switch(stability) {
				case 'a':
					// Y = 0.5249(X^0.728) 
					return 0.5249 * Math.pow(x, 0.728);
					return 80.1883 * Math.pow(x, 0.728); 
				break;
				case 'c':
					// Y = 0.1523(X^0.6986) 
					return 0.1523 * Math.pow(x, 0.6986); 
					return 18.9835 * Math.pow(x, 0.6986); 
				break;
				case 'e':
					// Y = 0.0461(X^0.6055) 
					return 0.0461 * Math.pow(x, 0.6055);
					return 3.0238 * Math.pow(x, 0.6055); 
				break;		
			}
		},
		_guessLabel: function (stability) {
			var label = 'Unstable';
			switch(stability) {
				case 'c':
				case 'd':
					label = 'Neutral';
				break;
				case 'e':
				case 'f':
					label = 'Stable';
				break;
			}
			return label;
		},
		_updateCalculatedConcentration: function() {
			var $plugin = this;
			var values = $plugin._activeValues;
			// update the calculated point value

			var x = values['concentrationY'];
			var z = values['concentrationZ'];
			
			var calcResult = $plugin._airPuff({x: x, z: z});
			
			$('strong.calc-result').text($plugin._formatForDisplay(calcResult));
		},
		_pre: function(x) {
			return Math.pow(10, x);
		},
		_post: function(x) {
			return Math.log(x) / Math.LN10;
		},
		_buildSYGraph: function() {
		  //debugger
			var $plugin = this;
			var values = $plugin._activeValues;
			var boundingBox = [
				0, // x min
				5.5, // y max
				5.5, // x max
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
					return (Math.round($plugin._pre(tick.usrCoords[1] - 1) * 100)/100).toString();
				 }
			});
			ticksY = board.create('ticks', [yAxis, 1], {
				drawLabels: true,
				// Show the tick marker at zero (or, in this case: 1)
				drawZero: false,
				generateLabelText: function (tick, zero) {
					return Math.round($plugin._pre(tick.usrCoords[2] - 1)).toString();
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
			var i = 1;
			for(var _stability in $plugin._sx) {
				switch(_stability) {
					case 'a':
					case 'c':
					case 'e':
						// note that you have to wrap functions created in loops with an anonymous function so that values get copied, otherwise, clicking collapses the lines
						// https://groups.google.com/forum/#!msg/jsxgraph/3QUMWmJJSwg/URZenNuH4vsJ
						(function(stability) {
							functions[stability] = function(x) { 
								//return i + Math.exp(x);
								return $plugin._calculateSX(x, stability);
							};
							
							plots[stability] = board.create('functiongraph', [function (x) {
								return $plugin._post(functions[stability]($plugin._pre(x)));
							}, 0, 10], {
								name: $plugin._guessLabel(stability),
								withLabel: true,
								strokeColor: $plugin._colors[stability],
								highlightStrokeColor: $plugin._colors[stability],
								showInfobox: false,
								needsRegularUpdate: true
							});
						})(_stability);
						i++;
					break;
				}
			}
			
						
			$plugin._boards['SXBoard'].on('mousemove', function(e) {		
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'SXBoard');
				var x = $plugin._pre(coords.usrCoords[1]);
				
				for(var stability in $plugin._sx) {
					switch(stability) {
						case 'a':
						case 'c':
						case 'e':
							var xPoint = x;
							var yPoint = $plugin._calculateSX(x, stability);
							var xDisplay = $plugin._pre($plugin._post(x) -1 );
							var yDisplay = $plugin._calculateSX(xDisplay, stability);
							if($plugin._points['SXPoint' + stability] != undefined) {
								$plugin._points['SXPoint' + stability].remove();
							}
							$plugin._points['SXPoint' + stability] = $plugin._boards['SXBoard'].create('point', [$plugin._post(xPoint), $plugin._post(yPoint)], {
								strokeWidth: 1,
								withLabel: false,
								fillColor:  $plugin._colors[stability],
								strokeColor:  $plugin._colors[stability],
								showInfobox: false,
								dash:2
							});
							$plugin._points['SXPoint' + stability].clearTrace();
							//y = $plugin._calculateSX($plugin._post(x), stability);
							$('.SXGraph.' + stability + '-value').html($plugin._guessLabel(stability) + ':<br/>(' + $plugin._formatForDisplay(xDisplay) + ', ' + $plugin._formatForDisplay(yDisplay) + ')');
						break;
					}
				}
			});
			
			// labels
			$('.y-axis-label.SXGraph').html('&sigma;<sub>y</sub>, meter (&sigma;<sub>y</sub> = &sigma;<sub>x</sub>)');
			$('.x-axis-label.SXGraph').html('Distance downwind, meter');
			
		},
		_buildSZGraph: function() {
		  //debugger
			var $plugin = this;
			var values = $plugin._activeValues;
			var boundingBox = [
				0, // x min
				5.5, // y max
				6.5, // x max
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
					 return ($plugin._pre(Math.round(tick.usrCoords[1] - 1))).toString();
				 }
			});
			ticksY = board.create('ticks', [yAxis, 1], {
				drawLabels: true,
				// Show the tick marker at zero (or, in this case: 1)
				drawZero: false,
				generateLabelText: function (tick, zero) {
					
					/*
					return Math.pow(10, tick.usrCoords[2] - 0.5) - 0.25;
					return Math.pow(10, tick.usrCoords[2] - 1) + 0.25;
					return tick.usrCoords[2] + 0.25;
					return $plugin._pre($plugin._post(tick.usrCoords[2]));
					return $plugin._formatForDisplay(Math.pow(10, tick.usrCoords[2])/4).toString();
					*/
					return Math.round($plugin._pre(tick.usrCoords[2] - 1)).toString();
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
			var i = 1;
			for(var _stability in $plugin._sx) {
				switch(_stability) {
					case 'a':
					case 'c':
					case 'e':
						// note that you have to wrap functions created in loops with an anonymous function so that values get copied, otherwise, clicking collapses the lines
						// https://groups.google.com/forum/#!msg/jsxgraph/3QUMWmJJSwg/URZenNuH4vsJ
						(function(stability) {
							functions[stability] = function(x) { 
								//return i + Math.exp(x);
								return $plugin._calculateSZ(x, stability);
							};
							var label = 'Unstable';
							switch(stability) {
								case 'c':
								case 'd':
									label = 'Neutral';
								break;
								case 'e':
								case 'f':
									label = 'Stable';
								break;
							}							
							plots[stability] = board.create('functiongraph', [function (x) {
								return $plugin._post(functions[stability]($plugin._pre(x)));
							}, 0, 10], {
								name: $plugin._guessLabel(stability),
								withLabel: true,
								strokeColor: $plugin._colors[stability],
								highlightStrokeColor: $plugin._colors[stability],
								showInfobox: false,
								needsRegularUpdate: true
							});
						})(_stability);
						i++;
					break;
				}
			}	
			$plugin._boards['SZBoard'].on('mousemove', function(e) {		
				var i;
				if (e[JXG.touchProperty]) {
						// index of the finger that is used to extract the coordinates
						i = 0;
				}
				coords = $plugin._getMouseCoords(e, i, 'SZBoard');
				var x = $plugin._pre(coords.usrCoords[1]);
				
				for(var stability in $plugin._sx) {
					switch(stability) {
						case 'a':
						case 'c':
						case 'e':
							var xPoint = x;
							var yPoint = $plugin._calculateSZ(x, stability);
							var xDisplay = $plugin._pre($plugin._post(x)-1);
							var yDisplay = $plugin._calculateSZ(xDisplay, stability);
							if($plugin._points['SZPoint' + stability] != undefined) {
								$plugin._points['SZPoint' + stability].remove();
							}
							$plugin._points['SZPoint' + stability] = $plugin._boards['SZBoard'].create('point', [$plugin._post(xPoint), $plugin._post(yPoint)], {
								strokeWidth: 1,
								withLabel: false,
								fillColor:  $plugin._colors[stability],
								strokeColor:  $plugin._colors[stability],
								showInfobox: false,
								dash:2
							});
							$plugin._points['SZPoint' + stability].clearTrace();
							//y = $plugin._calculateSZ($plugin._post(x), stability);
							$('.SZGraph.' + stability + '-value').html($plugin._guessLabel(stability) + ':<br/>(' + $plugin._formatForDisplay(xDisplay) + ', ' + $plugin._formatForDisplay(yDisplay) + ')');
						break;
					}
				}
			});
			
			// labels
			$('.y-axis-label.SZGraph').html('&sigma;<sub>z</sub>, meter');
			$('.x-axis-label.SZGraph').html('Distance downwind, meter');
			
		},
		_buildVaryYGraph: function() {
      //debugger
			var $plugin = this;
			var values = $plugin._activeValues;
			var Ymax = $plugin._airPuff({x: 0, z: values['graphZ']});
			var Xmax;
			// calculate x max
			var i = 0;
			var airPuffIncrement = 0;
			//assume fixedTime

			airPuffY = Ymax;
			//trace("Current y: " + airPuffY);
			var airPuffOldY = airPuffY;
			var airPuffTempYmax = airPuffY;
			var airPuffZorYCalcNum = 0;
			while (1) {
				airPuffY = $plugin._airPuff({x: airPuffIncrement, z: values['graphZ']});
				if (airPuffOldY <= (airPuffTempYmax / 100)) {
					Xmax = airPuffIncrement;
					break;
				}
				if (i > 1000) {
					break;
				}
				i++;
				//trace("Increment: " + airPuffIncrement);
				//trace("Old y: " + airPuffOldY);
				if (airPuffZorYCalcNum == 0) {
					airPuffIncrement += 0.1;
				}
				else {
					airPuffIncrement += airPuffZorYCalcNum / 10;
				}
				airPuffOldY = airPuffY;
				Xmax = airPuffIncrement;
			}
					
			//var Xmax = values['hr'] + 1;		
			
			var Ymin = $plugin._airPuff({x: Xmax, z: values['graphZ']});
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
				Ymax * 1.1, // y max
				Xmax, // x max
				Ymin // y min
			];

			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingYBoard'] = JXG.JSXGraph.initBoard('varyingYGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingYBoard'].create('functiongraph', [function(x) {
				return $plugin._airPuff({x: x, z: values['graphZ']});
			}], {	
				strokeColor: $plugin._colors['a'],
				highlightStrokeColor: $plugin._colors['a']
			});
			var xAxis = $plugin._boards['varyingYBoard'].create('line', [[Xmin, Ymax], [Xmax, Ymax]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1,
				fixed: true
			});
			var ticksX = board.create('ticks', [xAxis, 1], {
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
				var y = $plugin._airPuff({x: x, z: values['graphZ']});
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
		  //debugger
			var $plugin = this;
			var values = $plugin._activeValues;	
			
			var Xmax = values['hr'] + 1;
			var Xmin = values['hr'] - 1;
			var Ymax = $plugin._airPuff({x: values['graphY'], z: values['hr']});
			var Ymin = $plugin._airPuff({x: values['graphY'], z: Xmax});
			// JSXGraph can't graph, and hangs the page if our plot is too tiny
			if (Ymax < 1e-15) {
			  Ymax = 1e-10;
			}
			if (Ymin < 1e-15) {
			  Ymin = 1e-10;
			}
			var boundingBox = [
				Xmin, // x min
				Ymax * 1.1, // y max
				Xmax, // x max
				Ymin // y min
			];
			
			JXG.Options.text.useMathJax = true;
			$plugin._boards['varyingZBoard'] = JXG.JSXGraph.initBoard('varyingZGraph', {boundingbox: boundingBox, axis:true, showCopyright:false});

			$plugin._boards['varyingZBoard'].create('functiongraph', [function(x) {
				return $plugin._airPuff({x: values['graphY'], z: x});
			}], {
				strokeColor: $plugin._colors['a'], 
				highlightStrokeColor: $plugin._colors['a']
			});
			
			var yAxis = $plugin._boards['varyingZBoard'].create('line', [[Xmin + (0.1 * (Xmax - Xmin)), 0], [Xmin + (0.1 * (Xmax - Xmin)), 100]], {
				strokeColor: '#000000', 
				highlightStrokeColor: '#000000',
				strokeWidth: 1, 
				fixed: true
			});
			
			var ticksY = $plugin._boards['varyingZBoard'].create('ticks', [yAxis, Ymax/10], {
				drawLabels: true,
				// Show the tick marker at zero (or, in this case: 1)
				drawZero: false,
				generateLabelText: function (tick, zero) {
					return (Math.round(tick.usrCoords[2])).toString();
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
				var y = $plugin._airPuff({x: values['graphY'], z: x});
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
		_airPuff: function(points) {
			var $plugin = this;
			var values = $plugin._activeValues;
			// t should be in years
			y = points['x'];
			z = points['z'];
      
      // dy = dx, always dispersion in both directions is equal
			return values['qt'] / (Math.pow(2 * Math.PI, 3/2) * values['dx'] * values['dx'] * values['dz']) * Math.pow(Math.E, (-0.5 * Math.pow(( y /values['dx']), 2))) * (Math.pow(Math.E, -0.5 * Math.pow((z - values['hr']) / values['dz'], 2)) + Math.pow(Math.E, -0.5 * Math.pow((z + values['hr']) / values['dz'], 2)));	
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
	
	// then initialize air puff
	$('.air-puff-form').air_puff();
})(jQuery);
