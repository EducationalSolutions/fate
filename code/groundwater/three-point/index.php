<?php 
$title = 'Three Point Problem';
require_once('../../includes/header.php');
?>
<link rel="stylesheet" href="../../js/vendor/jquery-ui/jquery-ui.min.css" media="all">
<div class="groundwaterThreePoint">
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
				This section of Fate will aid you in calculating the flow direction of groundwater based on measurements taken at three wells.
			</p>
		</div>
	</div>
	<div class="row">
		<div class="small-12 columns">
			<form class="groundwater-threepoint-form fate-form" action="../../groundwater/three-point/" method="get" id="groundwater-threepoint-form" accept-charset="UTF-8">
				<div class="row medium-uncollapse">
					</div>
					<div class="columns medium-3">
						<fieldset class="fieldset well1">
							<legend> Well 1</legend>
							<label for="x1" class="required">X position = 
								<input type="text" id="x1" name="x1" value="826" size="5" maxlength="5" class="x1 required" required="required" aria-required="true" />
							</label>
							<label for="y1" class="required">Y position = 
								<input type="text" id="y1" name="y1" value="804" size="5" maxlength="5" class="y1 required" required="required" aria-required="true" />
							</label>
							<label for="h1" class="required">Head = 
								<input type="text" id="h1" name="h1" value="19" size="5" maxlength="5" class="h1 required" required="required" aria-required="true" />
							</label>
						</fieldset>
					</div>
					<div class="columns medium-3">
						<fieldset class="fieldset well2">
							<legend> Well 2</legend>
							<label for="x2" class="required">X position = 
								<input type="text" id="x2" name="x2" value="174" size="5" maxlength="5" class="x2 required" required="required" aria-required="true" />
							</label>
							<label for="y2" class="required">Y position = 
								<input type="text" id="y2" name="y2" value="370" size="5" maxlength="5" class="y2 required" required="required" aria-required="true" />
							</label>
							<label for="h2" class="required">Head = 
								<input type="text" id="h2" name="h2" value="20" size="5" maxlength="5" class="h2 required" required="required" aria-required="true" />
							</label>
						</fieldset>
					</div>
					<div class="columns medium-3">
						<fieldset class="fieldset well3">
							<legend> Well 3</legend>
							<label for="x3" class="required">X position = 
								<input type="text" id="x3" name="x3" value="152" size="5" maxlength="5" class="x3 required" required="required" aria-required="true" />
							</label>
							<label for="y3" class="required">Y position = 
								<input type="text" id="y3" name="y3" value="870" size="5" maxlength="5" class="y3 required" required="required" aria-required="true" />
							</label>
							<label for="h3" class="required">Head = 
								<input type="text" id="h3" name="h3" value="21" size="5" maxlength="5" class="h3 required" required="required" aria-required="true" />
							</label>
						</fieldset>
					</div>
					<div class="columns medium-3">
						<fieldset class="fieldset">
							<legend> Result</legend>
							<p class="verify">Angle of flow from North<br /> <strong class="angle"></strong></p>
						</fieldset>
					</div>
				</div>
				<div class="row">
				<fieldset class="fieldset">
				<div class="map">
					<div class="row">
						<div class="columns small-1">0</div>
						<div class="columns small-9 text-center">Distance East or West</div>
						<div class="columns small-2">1000</div>
					</div>
					<div class="canvas">
						<div class="well" id="well-1">1</div>
						<div class="well" id="well-2">2</div>
						<div class="well" id="well-3">3</div>
						<div class="arrow">&uarr;</div>
					</div>
					<div class="y-axis">
						<div class="columns small-1">1000</div>
						<div class="columns small-10 text-center">Distance North or South</div>
						<div class="columns small-1 text-right">0</div>
					</div>
				</div>
				</fieldset>
				</div>
</form>
</div>
</div>
</div>

<?php
require_once('../../includes/js.php');
?>
<script src="../../js/vendor/jquery-ui/jquery-ui.min.js"></script>
<script src="groundwaterThreePoint.js"></script>
<?php
require_once('../../includes/footer.php');
