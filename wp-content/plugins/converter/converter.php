<?php
/*
Plugin Name: 3ATDev Converter
Version: 1.0.0
Author: Vadim Malashenko
*/

require_once 'vendor/autoload.php';

use ATDev\Tools\Converter\CoinMarket;
use ATDev\Tools\Converter\Config;
use ATDev\Tools\Converter\Plugin;

$GLOBALS['converter'] = new Plugin( __DIR__, new CoinMarket( Config::create( __DIR__ )->load( 'default' )->api ) );