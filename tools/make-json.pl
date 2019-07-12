use strict;
use warnings;

use Getopt::Long;
use Hash::Ordered;
use HTTP::Tiny;
use JSON::PP ();

GetOptions( 'base-url=s', \my $base_url, 'version=s', => \my $version );
unless ( $base_url && $version ) {
    my $script = __FILE__;
    print
        "usage: perl $script --base-url=http://???/mt-data-api.cgi --version=v4\n";
    exit 1;
}

my $json_pp = JSON::PP->new->indent_length(4)->pretty->space_before(0);

my $res_json
    = HTTP::Tiny->new->get("$base_url/$version/endpoints")->{content};

my @endpoints = @{ $json_pp->decode($res_json)->{items} };

my %uniq_endpoints;
my @endpoints_reverse_version_order
    = sort { ( $b->{version} || 0 ) <=> ( $a->{version} || 0 ) } @endpoints;
for my $e (@endpoints_reverse_version_order) {
    $uniq_endpoints{ $e->{id} } ||= $e;
}

my @reverse_uniq_endpoints;
my %seen_id;
for my $id ( map { $_->{id} } reverse @endpoints ) {
    next if $seen_id{$id};
    push @reverse_uniq_endpoints, $uniq_endpoints{$id};
    $seen_id{$id} = 1;
}

my @new_endpoints;
for my $e ( reverse @reverse_uniq_endpoints ) {
    tie my %hash, 'Hash::Ordered',
        (
        id        => $e->{id},
        route     => $e->{route},
        verb      => $e->{verb},
        resources => $e->{resources},
        );
    push @new_endpoints, \%hash;
}

my $endpoints_json = $json_pp->encode( \@new_endpoints );

print $endpoints_json;

