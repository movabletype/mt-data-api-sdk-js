package Plack::Middleware::MT::SetHeaders;

use strict;
use warnings;
use utf8;
use parent 'Plack::Middleware';
use Plack::Util::Accessor qw(headers);

sub call {
    my ( $self, $env ) = @_;

    my $res = $self->app->($env);
    $self->response_cb(
        $res,
        sub {
            my $res = shift;
            if ( defined $res->[2] ) {
                my $h = Plack::Util::headers( $res->[1] );
                for my $k ( keys %{ $self->headers } ) {
                    $h->set( $k => $self->headers->{$k} );
                }
            }
        }
    );
}

1;
