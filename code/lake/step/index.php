<?php 
$title = 'Step Release into a Lake';
require_once('../../includes/header.php');
?>
<div class="lakeStep">
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
				Lakes are an important part of our aquatic ecosystem, but are subject to sources of pollution. This section of Fate allows you to estimate the concentration of a pollutant in a lake when the source of the pollution is a step or constant input. Examples of step inputs are typically effluents from industrial plants.  This model assumes that the pollutant will be immediately mixed and evenly distributed in the lake. 
			</p>
		</div>
	</div>
	<div class="row">
		<div class="small-12 columns">
			<form class="lake-step-form fate-form" action="../../lake/step/" method="get" id="lake-step-form" accept-charset="UTF-8">
				<fieldset class="fieldset">
					<legend> Step 1</legend> Manually convert input data to metric units: meters, Kg/day, or Ci/day. 
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 2: Enter the lake volume</legend>
					<label for="v" class="v required">Lake volume<br />
					V = 
					<input type="text" id="v" name="v" value="250000" size="9" maxlength="128" class="v required" required="required" aria-required="true" />
					m<sup>3</sup> (only used for calculated t<sub>0</sub>)</label>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 3: Enter or calculate the detention time in the lake</legend> <label for="t0Method" class="t0Method"> 
					<select id="t0Method" name="t0Method" class="t0Method">
						<option value="calculated" selected="selected">Use calculated detention time</option>
						<option value="entered">Use entered value for detention time</option>
					</select>
					</label>
					<label for="q" class="q required">Outlet flow rate<br />
					Q = 
					<input type="text" id="q" name="q" value="45000" size="9" maxlength="128" class="q required" required="required" aria-required="true" />
					m<sup>3</sup>/year (only used for calculated t<sub>0</sub>)</label>  
					<div class="row">
						<div class="medium-5 columns">
							<div class="t0Calculated">
								Calculated value for t<sub>0</sub>: <strong class="t0Calculated"></strong> years 
							</div>
						</div>
						<div class="medium-4 columns end">
							\[t_0 = \frac{Volume}{Flow\ Rate}\] 
						</div>
					</div>
					</label> <label for="t0Entered" class="t0Entered required">Entered detention time<br />
					t<sub>0</sub> = 
					<input type="text" id="t0Entered" name="t0Entered" value="5.56" size="5" maxlength="128" class="t0Entered required" required="required" aria-required="true" />
					years </label> 
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 4: Calculate first order rate constant</legend> 
					<div class="row">
						<div class="medium-5 columns">
							<label for="halfLife" class="halfLife required">Half-life<br />
							<input type="text" id="halfLife" name="halfLife" value="0.12" size="5" maxlength="128" class="halfLife required" required="required" aria-required="true" />
							</label> <label for="halfLifeIncrement" class="halfLifeIncrement"> 
							<select id="halfLifeIncrement" name="halfLifeIncrement" class="halfLifeIncrement">
								<option value="year" selected="selected" />
								Years</option>
								<option value="day">Days</option>
								<option value="hour">Hours</option>
								<option value="minute">Minutes</option>
							</select>
							</label> 
						</div>
						<div class="medium-4 columns end">
							<!-- \[k = -\frac{ln(\frac{C}{C_0})}{t} \] -->
							\[ln(\frac{C}{C_o}) = -kt_\frac{1}{2} \]
						</div>
					</div>
					<div class="rateConstantCalcNum">
					</div>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 5: Average loading of pollutant in the lake</legend> <label for="w" class="w with-units required">
					W = 
					<input type="text" id="w" name="w" value="50" size="5" maxlength="128" class="w required" required="required" aria-required="true" />
					</label> <label for="massType" class="massType"> 
					<select id="massType" name="massType" class="massType">
						<option value="Kg/day" selected="selected">Kg/day</option>
						<option value="Ci/day">Ci/day</option>
					</select>
					</label> 
				</fieldset>
				<fieldset class="fieldset">
					<legend> Step 6: Verify data</legend> 
					<table class="verify">
						<thead>
							<tr>
								<th>Data Point</th>
								<th>Value</th>
								<th>Unit</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Lake volume (V)</td>
								<td class="v"></td>
								<td colspan="2">m<sup>3</sup></td>
							</tr>
							<tr>
								<td>Detention time (t<sub>0</sub>)</td>
								<td class="t0"></td>
								<td colspan="2">years</td>
							</tr>
							<tr>
								<td>First order rate constant (k)</td>
								<td class="k"></td>
								<td colspan="2">/year</td>
							</tr>
							<tr>
								<td>Decay rate (&beta;)</td>
								<td class="decayRate"></td>
								<td>/year</td>
								<td>\[&beta; = \frac{1}{t_0}+k\]</td>
							</tr>
						</tbody>
					</table>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Concentration calculations</legend> <label for="concentrationTime" class="concentrationTime required">Time <br />
					<input type="text" id="concentrationTime" name="concentration time" value="1" size="5" maxlength="128" class="concentrationTime required" required="required" aria-required="true" />
					</label> 
					<select id="timeType" name="timeType" class="timeType">
						<option value="year" selected="selected">Years</option>
						<option value="week">Weeks</option>
						<option value="day">Days</option>
					</select>
					<p>
						Result: <strong class="calc-result"></strong> 
					</p>
				</fieldset>
				<fieldset class="fieldset">
					<legend> Graph varying time</legend> 
					<div class="equation">
						\[C_{(t)} = \frac{W}{&beta;V}(1-e^{-&beta;t}) \] 
					</div>
					<div class="row relative">
						<div class="graphWrapper">
							<div id="varyingTimeGraph" class="jxgbox">
							</div>
						</div>
						<div class="y-axis-label varyingTimeGraph">
						</div>
					</div>
					<div class="row">
						<div class="x-axis-label varyingTimeGraph columns small-10 small-offset-2">
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

<script src="lakeStep.js?v=3"></script>
<?php
require_once('../../includes/footer.php');
