<div class="title-bar" data-responsive-toggle="fate-menu" data-hide-for="medium">
	<button class="menu-icon" type="button" data-toggle></button> 
	<div class="title-bar-title">
		Menu 
	</div>
</div>
<div class="top-bar" id="fate-menu">
	<div class="top-bar-left">
		<ul class="dropdown menu" data-dropdown-menu>
			<li class="menu-text"><a href="/fate/2016/welcome/home/" class="home-link">Fate</a></li>
			<li class="has-submenu"><a href="#">River</a> 
			<ul class="submenu menu vertical" data-submenu>
				<li> <a href="../../river/pulse" title="River: Pulse release of a pollutant" >Pulse release of a pollutant</a> </li>
				<li> <a href="../../river/step" title="River: Step input of a pollutant" >Step input of a pollutant</a> </li>
				<li> <a href="../../river/streeter-phelps" title="River: Streeter-Phelps/DO Sag Curve" >Streeter-Phelps/DO Sag Curve</a> </li>
			</ul>
			</li>
			<li class="has-submenu"><a href="#">Lake</a> 
			<ul class="submenu menu vertical" data-submenu>
				<li> <a href="../../lake/pulse" title="Lake: Pulse release of a pollutant" >Pulse release of a pollutant</a> </li>
				<li> <a href="../../lake/step" title="Lake: Step input of a pollutant" >Step input of a pollutant</a> </li>
			</ul>
			</li>
			<li class="has-submenu"><a href="#">Groundwater</a> 
			<ul class="submenu menu vertical" data-submenu>
				<li> <a href="../../groundwater/pulse" title="Groundwater: Pulse release of a pollutant" >Pulse release of a pollutant</a> </li>
				<li> <a href="../../groundwater/step" title="Groundwater: Step input of a pollutant" >Step input of a pollutant</a> </li>
				<li> <a href="../../groundwater/three-point" title="Groundwater: Three point problem" >Three point problem</a> </li>
			</ul>
			</li>
			<li class="has-submenu"><a href="#">Air</a> 
			<ul class="submenu menu vertical" data-submenu>
				<li> <a href="../../air/plume" title="Air: Plume release of a pollutant" >Plume release of a pollutant</a> </li>
				<li> <a href="../../air/puff" title="Air: Puff release of a pollutant" >Puff release of a pollutant</a> </li>
			</ul>
			</li>			
		</ul>
	</div>
	<div class="top-bar-right">
    <ul class="dropdown menu" data-dropdown-menu>
      <li class="has-submenu"><a href="#">Help</a> 
      <ul class="submenu menu vertical help" data-submenu>
      	<li> <a href="./" title="Reset Values" >Reset Values</a></li>
				<li> <a href="additional.pdf" title="Additional Problems" >Additional Problems</a></li>
				<li> <a href="background.pdf" title="Background" >Background</a></li>
				<li> <a href="explanation.pdf" title="Explanation of Sample Problems" >Explanation of Sample Problem</a></li>
				<?php 
				if(
					strpos($_SERVER['REQUEST_URI'], '/river/') !== false  
					|| strpos($_SERVER['REQUEST_URI'], '/lake/') !== false
					|| strpos($_SERVER['REQUEST_URI'], '/groundwater/pulse') !== false
					|| strpos($_SERVER['REQUEST_URI'], '/groundwater/step') !== false
					|| strpos($_SERVER['REQUEST_URI'], '/air/') !== false
				) {
				?>
					<li> <a href="../../useful/decay-rates.pdf" title="Rate Constants">Rate Constants</a></li>
					<li> <a href="../../useful/unit-conversions.pdf" title="Unit Conversions">Unit Conversions</a></li>
				<?php
				}
				?>
				<?php 
				if(
					strpos($_SERVER['REQUEST_URI'], '/river/streeter-phelps') !== false
				) {
				?>
					<li> <a href="../../useful/do-table.pdf" title="DO Solubility Table">DO Solubility Table</a></li>
					<li> <a href="../../useful/k2-table.pdf" title="Rearation Rate Constants">Rearation Rate Constants</a></li>
				<?php
				}
				?>
			</ul>
			</li>
    </ul>
  </div>
</div>