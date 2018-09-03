<?php 
$title = 'Step Release into a Stream';
require_once('../../includes/header.php');
?>
<div class="riverStep">
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
			In this section of Fate you can enter data to predict the concentration of a pollutant in a stream. The input of the pollutant is treated as a step input; for example, the continuous release of industrial waste and mixing with river water. The model used here is a one-dimensional advection-dispersion equation that can also account for the first-order degradation or removal. A sample problem has been loaded with values similar to those you might need. 
		</p>
	</div>
</div>
<div class="row">
	<div class="small-12 columns">
		<form class="river-step-form fate-form" action="../../river/step/" method="get" id="river-step-form" accept-charset="UTF-8">
			<fieldset class="fieldset">
				<legend> Step 1</legend> Manually convert input data to metric units: meters, kilograms, or curies. 
			</fieldset>
			<fieldset class="fieldset">
				<legend> Step 2: Data entry</legend> 
				<label for="d" class="required">Stream depth <br />
				d = 
				<input type="text" id="d" name="d" value="2.3" size="5" maxlength="128" class="d required" required="required" aria-required="true" />
				m</label> <label for="w" class="required">Stream width<br />
				w = 
				<input type="text" id="w" name="w" value="20" size="5" maxlength="128" class="w required" required="required" aria-required="true" />
				m</label> <label for="m" class="m required">Mass input <br />
				W = 
				<input type="text" id="m" name="m" value="0.0125" size="5" maxlength="128" class="m required" required="required" aria-required="true" />
				</label> <label for="massType" class="massType"> 
				<select id="massType" name="massType" class="massType">
					<option value="Kg" selected="selected">Kg/s</option>
					<option value="Ci">Ci/s</option>
				</select>
				</label> <label class="v required">Water velocity<br />
				v = 
				<input type="text" id="v" name="v" value="0.85" size="5" maxlength="128" class="v required" required="required" aria-required="true" />
				m/s </label> 
				<label class="q required">Stream flow rate<br />
				Q = 
				<input type="text" id="q" name="q" value="39.1" size="5" maxlength="128" class="q required" required="required" aria-required="true" />
				m<sup>3</sup>/s </label> 
			</fieldset>
			<fieldset class="fieldset">
				<legend> Step 3: Enter or calculate the longitudinal dispersion coefficient, E</legend> 
				<label for="s" class="s required">Channel slope s = 
				<input type="text" id="s" name="s" value="0.00067" size="5" maxlength="128" class="s required" required="required" aria-required="true" />
				(unitless and not required if E is entered) </label> 
				<label for="g" class="g required">Gravity constant<br />
				g = 
				<input type="text" id="g" name="g" value="9.81" size="5" maxlength="128" class="g required" required="required" aria-required="true" />
				m/s<sup>2</sup> </label> 
				<label for="eMethod" class="eMethod"> 
				<select id="eMethod" name="eMethod" class="eMethod">
					<option value="calculated" selected="selected">Use calculated value for E</option>
					<option value="entered">Use entered value for E</option>
				</select>
				</label>
			<div class="row">
			<div class="medium-5 columns">
			<p class="verify">
				Calculated value for E: <strong class="eCalculated"></strong> m<sup>2</sup>/s 
			</p>
			</div>
			<div class="medium-4 columns end">
				\[E = 0.011 \frac{v^2*w^2}{d\sqrt{gds}}\]
			</div>
			</div>
			</label> 
			<label for="eEntered" class="eEntered required">Entered value for E<br />
			E = 
			<input type="text" id="eEntered" name="eEntered" value="11.24" size="5" maxlength="128" class="eEntered required" required="required" aria-required="true" />
			m<sup>2</sup>/s </label> 
		</fieldset>
		<fieldset class="fieldset">
			<legend> Step 4: Calculate first order rate constant</legend> 
			<div class="row">
			<div class="medium-5 columns">
			<label for="halfLife" class="halfLife required">Half-life<br />
			<input type="text" id="halfLife" name="halfLife" value="2.5" size="5" maxlength="128" class="halfLife required" required="required" aria-required="true" />
			</label> <label for="halfLifeIncrement" class="halfLifeIncrement"> 
			<select id="halfLifeIncrement" name="halfLifeIncrement" class="halfLifeIncrement">
				<option value="year" />
				Years</option>
				<option value="day" selected="selected">Days</option>
				<option value="hour">Hours</option>
				<option value="minute">Minutes</option>
			</select>
			</label> 
			</div>
			<div class="medium-4 columns end">
				<!-- \[k = -\frac{ln(\frac{C}{C_0})}{t_1 v_2} \] -->
				\[ln(\frac{C}{C_o}) = -kt_\frac{1}{2} \]
			</div>
			</div>
			<p class="verify">k = <strong class="rateConstantCalcNum"></strong>
			</p>
		</fieldset>
		<fieldset class="fieldset">
			<legend> Step 5: Verify data</legend> 
			<table class="verify">
				<thead>
					<tr>
						<th>Data Point</th>
						<th>Value</th>
						<th>Unit</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Stream depth (d)</td>
						<td class="d"></td>
						<td>m</td>
					</tr>
					<tr>
						<td>Stream width (w)</td>
						<td class="w"></td>
						<td>m</td>
					</tr>
					<tr>
						<td>Mass input (W)</td>
						<td class="m"></td>
						<td class="massType">Kg/s</td>
					</tr>
					<tr>
						<td>Water velocity (v)</td>
						<td class="v"></td>
						<td>m/s</td>
					</tr>
					<tr>
						<td>Stream flow rate (Q)</td>
						<td class="q"></td>
						<td>m<sup>3</sup>/s</td>
					</tr>
					<tr>
						<td>Longitudinal dispersion coefficient (E)</td>
						<td class="e"></td>
						<td>m<sup>2</sup>/s</td>
					</tr>
					<tr>
						<td>First order rate constant (k)</td>
						<td class="k"></td>
						<td>/second</td>
					</tr>
				</tbody>
			</table>
		</fieldset>
		<fieldset class="fieldset">
			<legend> Concentration calculations</legend> <label for="concentrationDistance" class="concentrationDistance required">Distance <br />
			<input type="text" id="concentrationDistance" name="concentrationDistance" value="25" size="5" maxlength="128" class="concentrationDistance required" required="required" aria-required="true" />
			Km </label> 
			<p>
				Result: <span class="calc-result"></span> 
			</p>
		</fieldset>
		<fieldset class="fieldset">
			<legend> Graph varying distance</legend> 
			<div class="equation">
				\[C_{(x,t)} = \frac{W}{Q\sqrt{1+\frac{4kE}{v^2}}}e^{\frac{vx}{2E}\bigl(1±\sqrt{1+\frac{4kE}{v^2}}\bigr)} \]
			</div>
			<div class="row relative">
				<div class="graphWrapper">
				<div id="varyingDistanceGraph" class="jxgbox"></div>
				</div>
				<div class="y-axis-label"></div>
			</div>
			<div class="row">
			<div class="x-axis-label columns small-10 small-offset-2"></div>
			</div>
		</fieldset>		
	</form>
</div>
</div>
</div>
<?php
require_once('../../includes/js.php');
?>

<script src="riverStep.js"></script>
<?php
require_once('../../includes/footer.php');
