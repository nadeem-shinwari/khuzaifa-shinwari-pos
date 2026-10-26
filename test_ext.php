<?php
echo extension_loaded('pdo_mysql') ? 'pdo_mysql OK' : 'pdo_mysql MISSING';
echo PHP_EOL;
echo extension_loaded('pdo_sqlite') ? 'pdo_sqlite OK' : 'pdo_sqlite MISSING';
echo PHP_EOL;
?>