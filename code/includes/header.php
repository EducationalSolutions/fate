<?php
if(! isset($title)) {
	$title = 'Fate';
}
if($_SERVER["HTTPS"] != "on")
{
    header("Location: https://" . $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"]);
    exit();
}
?>
<!DOCTYPE html>
<html>
<head>
	<title><?php print $title; ?></title>
	<link rel="stylesheet" href="../../css/foundation.min.css" media="all" />
	<link rel="stylesheet" href="../../css/jsxgraph.css" media="all" />
	<link rel="stylesheet" href="../../css/app.css" media="all" />

<!--[if lte IE 8]>
	<script src="../../js/vendor/html5shiv/html5shiv.min.js?v=3.7.3"></script>
	<![endif]-->
</head>
<body>
<?php
require_once('menu.php');
?>
<div class="content" id="content">