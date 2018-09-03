<?php
$title = 'Continuous Release into the Air';
require_once('../../includes/header.php');
?>
<div class="airPlume">
	<div class="row">
		<div class="small-12 small columns">
			<h1>
<?php print $title; ?>
			</h1>
		</div>
	</div>
	<div class="row">
		<div class="small-11 small columns">
			<p>
				The three dimensional nature of our atmosphere often makes tracking airborne pollutants very difficult.  This section of Fate allows you to estimate the concentration of a pollutant at a specific distance downwind from a continually releasing source.  An example of a source that might release this type of pollutant is a cooling stack on a a pulp mill.
			</p>
		</div>
	</div>
	<div class="row">
		<div class="small-12 columns">
			<form class="air-plume-form fate-form" action="../../air/plume/" method="get" id="air-plume-form" accept-charset="UTF-8">
				<fieldset class="fieldset">
					<legend> Step 1</legend> Manually convert input data to metric units: meters, grams, and seconds.
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 2: Enter or calculate the release height</legend>
					<label for="hrMethod" class="hrMethod">
					<select id="hrMethod" name="hrMethod" class="hrMethod">
						<option value="calculated" selected="selected">Use calculated release height</option>
						<option value="entered">Use entered release height</option>
					</select>
					</label>
					<div class="hr-entered">
						<label for="hrEntered" class="hrEntered required">Height of release<br />
						H<sub>r</sub> =
						<input type="text" id="hrEntered" name="hrEntered" value="30" size="9" maxlength="128" class="hrEntered required" required="required" aria-required="true" />
						m</label>
					</div>
					<div class="hr-calculated">
						<p>Use the calculated value if the pollutant temperature is higher than the air temperature.</p>
						<label for="hri" class="hri required">Initial release height<br />
						H<sub>r</sub> =
						<input type="text" id="hri" name="hri" value="30" size="9" maxlength="128" class="hri required" required="required" aria-required="true" />
						m</label>
						<label for="us" class="us required">Stack exit velocity<br />
						&umacr;<sub>s</sub> =
						<input type="text" id="us" name="us" value="0.8" size="9" maxlength="128" class="us irequired" required="required" aria-required="true" />
						m/sec</label>
						<label class="u required">Wind speed<br />
						&umacr; =
						<input type="text" id="u" name="u" value="0.8" size="9" maxlength="128" class="u required" required="required" aria-required="true" />
						m/sec</label>
						<label for="d" class="d required">Inside stack diameter<br />
						d =
						<input type="text" id="d" name="d" value="0.8" size="9" maxlength="128" class="d required" required="required" aria-required="true" />
						m</label>
						<label for="p" class="p required">Atmospheric pressure<br />
						P =
						<input type="text" id="p" name="p" value="1010" size="9" maxlength="128" class="p required" required="required" aria-required="true" />
						mbar</label>
						<label for="ts" class="ts required">Stack gas temperature<br />
						T<sub>s</sub> =
						<input type="text" id="ts" name="ts" value="285" size="9" maxlength="128" class="ts required" required="required" aria-required="true" />
						°K</label>
						<label for="ta" class="ta required">Air temperature<br />
						T<sub>a</sub> =
						<input type="text" id="ta" name="ta" value="280" size="9" maxlength="128" class="ta required" required="required" aria-required="true" />
						°K</label>
						<label class="verify">Height of release H<sub>r</sub> + &Delta;H<sub>r</sub> <strong class="hrCalculated"></strong> m</label>
						\[ &Delta;H_r = \frac{&umacr;_sd}{&umacr;}(1.5 + 2.68 * 10^{-3}Pd\frac{T_s - T_s}{T_s}) \]
					</div>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 3: Enter the remaining data</legend>
					<label for="qm" class="q required">Source flow<br />
					Q<sub>m</sub> =
					<input type="text" id="qm" name="qm" value="20" size="9" maxlength="128" class="qm required" required="required" aria-required="true" />
					g/s</label>
					<label class="u required">Wind speed<br />
					&umacr; =
					<input type="text" id="u" name="u" value="0.8" size="9" maxlength="128" class="u required" required="required" aria-required="true" />
					m/sec</label>

				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 4: Choose atmospheric stability</legend>
						<label for="as" class="as required">Atmospheric stability<br />
							<select id="as" name="as" class="as">
								<option value="a" selected="selected" />
								A</option>
								<option value="b">B</option>
								<option value="c">C</option>
								<option value="d">D</option>
								<option value="e">E</option>
								<option value="f">F</option>
							</select>
						</label>
					<table>
					<thead>
						<tr>
							<th></th>
							<th colspan="3">Day Radiation Intensity</th>
							<th colspan="2">Night Cloud Cover</th>
						</tr>
						<tr>
							<th>Wind Speed (m/s)</th>
							<th>Strong</th>
							<th>Medium</th>
							<th>Slight</th>
							<th>Cloudy</th>
							<th>Calm and Clear</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>< 2</td>
							<td>A</td>
							<td>A-B</td>
							<td>B</td>
							<td></td>
							<td></td>
						</tr>
						<tr>
							<td>2-3</td>
							<td>A-B</td>
							<td>B</td>
							<td>C</td>
							<td>E</td>
							<td>F</td>
						</tr>
						<tr>
							<td>3-5</td>
							<td>B</td>
							<td>B-C</td>
							<td>C</td>
							<td>D</td>
							<td>E</td>
						</tr>
						<tr>
							<td>5-6</td>
							<td>C</td>
							<td>C-D</td>
							<td>D</td>
							<td>D</td>
							<td>D</td>
						</tr>
						<tr>
							<td>> 6</td>
							<td>C</td>
							<td>D</td>
							<td>D</td>
							<td>D</td>
							<td>D</td>
						</tr>
					</tbody>
					</table>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 5: Enter the dispersion coefficients</legend>
					<label for="dist" class="dist required">
					X =
					<input type="text" id="dist" name="dist" value="1.5" size="5" maxlength="128" class="dist required" required="required" aria-required="true" /> km
					</label>
					<label for="dx" class="dx required">
					&sigma;<sub>x</sub> =
					<input type="text" id="dx" name="dx" value="298.2" size="5" maxlength="128" class="dx required" required="required" aria-required="true" /> m
					(&sigma;<sub>x</sub> = &sigma;<sub>y</sub>)
					</label>
					<label for="dz" class="dz required">
					&sigma;<sub>z</sub> =
					<input type="text" id="dz" name="dx" value="1071" size="5" maxlength="128" class="dz required" required="required" aria-required="true" /> m
					</label>
					<div class="row relative">
						<div class="columns medium-6">
						  <h4 class="text-center">Horizontal</h4>
							<div class="graphWrapper">
								<div id="SXGraph" class="jxgbox"></div>
							</div>
								<div class="y-axis-label SXGraph"></div>
						</div>

						<div class="columns medium-6">
						  <h4 class="text-center">Vertical</h4>
							<div class="graphWrapper">
								<div id="SZGraph" class="jxgbox"></div>
							</div>
								<div class="y-axis-label SZGraph"></div>
						</div>
					</div>
					<div class="row">
						<div class="x-axis-label SXGraph columns medium-5 medium-offset-1">
						</div>
						<div class="x-axis-label SZGraph columns medium-5 medium-offset-1">
						</div>
					</div>
					<div class="row s-values">
						<div class="a-value SXGraph columns small-1">A:
						</div>
						<div class="b-value SXGraph columns small-1">B:
						</div>
						<div class="c-value SXGraph columns small-1">C:
						</div>
						<div class="d-value SXGraph columns small-1">D:
						</div>
						<div class="e-value SXGraph columns small-1">E:
						</div>
						<div class="f-value SXGraph columns small-1">F:
						</div>
						<div class="a-value SZGraph columns small-1">A:
						</div>
						<div class="b-value SZGraph columns small-1">B:
						</div>
						<div class="c-value SZGraph columns small-1">C:
						</div>
						<div class="d-value SZGraph columns small-1">D:
						</div>
						<div class="e-value SZGraph columns small-1">E:
						</div>
						<div class="f-value SZGraph columns small-1">F:
						</div>
					</div>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Concentration calculations</legend>
					<label for="concentrationY" class="concentrationY required">Distance left or right of source <br />
					Y = <input type="text" id="concentrationY" name="concentrationY" value="1.5" size="5" maxlength="128" class="concentrationY required" required="required" aria-required="true" />m
					</label>
					<label for="concentrationZ" class="concentrationZ required">Distance up or down from source <br />
					Z = <input type="text" id="concentrationZ" name="concentrationZ" value="4" size="5" maxlength="128" class="concentrationZ required" required="required" aria-required="true" />m
					</label>

					<p>
						Result: <strong class="calc-result"></strong> g/m<sup>3</sup>
					</p>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Graph varying distance in Y</legend>
					<label for="graphZ" class="graphZ required">Distance up or down from source <br />
					Z = <input type="text" id="graphZ" name="graphZ" value="4" size="5" maxlength="128" class="graphZ required" required="required" aria-required="true" />m
					</label>
					<div class="equation">
						\[C_{(x,y,z)} = \frac{Q_m}{2\pi\sigma_y\sigma_zu}e^{(-\frac{1}{2}(\frac{y}{\sigma_y})^2)}(e^{(-\frac{1}{2}(\frac{z-H_r}{\sigma_z})^2)}+e^{(-\frac{1}{2}(\frac{z+H_r}{\sigma_z})^2)}) \]
					</div>

					<div class="row relative">
						<div class="graphWrapper">
							<div id="varyingYGraph" class="jxgbox">
							</div>
						</div>
						<div class="y-man"><img src="../../images/man.png" /></div>
						<div class="y-axis-label varyingYGraph">
						</div>
					</div>
					<div class="row">
						<div class="x-axis-label varyingYGraph columns small-10 small-offset-2">
						</div>
					</div>
				</div>
			</fieldset>
			<fieldset class="fieldset">
					<legend> Graph varying distance in Z</legend>
					<label for="graphY" class="graphY required">Distance left or right of source <br />
					Y = <input type="text" id="graphY" name="graphY" value="1.5" size="5" maxlength="128" class="graphY required" required="required" aria-required="true" />m
					</label>
					<div class="equation">
						\[C_{(x,y,z)} = \frac{Q_m}{2\pi\sigma_y\sigma_zu}e^{(-\frac{1}{2}(\frac{y}{\sigma_y})^2)}(e^{(-\frac{1}{2}(\frac{z-H_r}{\sigma_z})^2)}+e^{(-\frac{1}{2}(\frac{z+H_r}{\sigma_z})^2)}) \]
					</div>
					<div class="row relative">
						<div class="graphWrapper">
							<div id="varyingZGraph" class="jxgbox">
							</div>
						</div>
						<div class="z-man"><img src="../../images/man.png" /></div>
						<div class="y-axis-label varyingZGraph">
						</div>
					</div>
					<div class="row">
						<div class="x-axis-label varyingZGraph columns small-10 small-offset-2">
						</div>
					</div>
				</div>
			</fieldset>
		</form>
	</div>
</div>


<?php
require_once('../../includes/js.php');
?>

<script src="airPlume.js"></script>
<?php
require_once('../../includes/footer.php');
