<?php
chdir('d:/Project/js/khuzaifa-shinwari');
require 'backend/src/bootstrap.php';
echo "SystemController exists: " . (class_exists('App\Controllers\SystemController') ? 'yes' : 'no') . "\n";
echo "CustomersController exists: " . (class_exists('App\Controllers\CustomersController') ? 'yes' : 'no') . "\n";