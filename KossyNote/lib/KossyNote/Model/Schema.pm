package KossyNote::Model::Schema;
use strict;
use warnings;
use Teng::Schema::Declare;
use DateTime;
use DateTime::Format::MySQL;

table {
	name 'notes';
	pk 'note_id';
	columns qw(
		note_id
		text
		created_at
	);
	inflate '^.+_at$' => sub {
		DateTime::Format::MySQL->parse_datetime(shift);
	};
	deflate '^.+_at$' => sub {
		DateTime::Format::MySQL->format_datetime(shift);
	};
};

1;
