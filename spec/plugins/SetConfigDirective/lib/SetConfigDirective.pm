
package SetConfigDirective;

use strict;
use warnings;
use utf8;

sub init_app {
    my ($cb, $app) = @_;
    $app->config->DataAPICORSAllowOrigin('*');
}

1;
