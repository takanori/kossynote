package KossyNote::Web;

use strict;
use warnings;
use utf8;

use FindBin;
use lib "$FindBin::Bin/../../lib";

use Kossy;
use KossyNote::Model;
use DateTime;

filter 'set_title' => sub {
	my $app = shift;
	sub {
		my ( $self, $c )  = @_;
		$c->stash->{site_name} = __PACKAGE__;
		$app->($self,$c);
	}
};

get '/' => [qw/set_title/] => sub {
	my ( $self, $c )  = @_;
	$c->render('index.tx', { });
};

post '/create' => sub {
	my ($self, $c) = @_;
	my $result = $c->req->validator([
			'text' => {
				rule => [
					['NOT_NULL', 'text is null'],
				],
			},
		]);
	if ($result->has_error) {
		my $error_messages = [$result->errors->{text}];
		return $c->render_json({error_messages => $error_messages});
	}
	my $note = $self->create_note($result->valid('text'));
	$c->render_json({note => $note});
};

get '/search' => sub {
	my ($self, $c) = @_;
	my $notes = $self->note_list;
	$c->render_json({notes => $notes});
};

post '/update' => sub {
	my ($self, $c) = @_;
	my $result = $c->req->validator([
			'text' => {
				rule => [
					['NOT_NULL', 'text is null'],
				],
			},
		]);
	if ($result->has_error) {
		my $error_messages = [$result->errors->{text}];
		return $c->render_json({ error_messages => $error_messages });
	}

	my $note = $self->update_note($c->req->param('note_id'), $result->valid('text'));
	$c->render_json({note => $note});
};

router 'DELETE' => '/delete' => sub {
	my ($self, $c) = @_;
	my $note_id = $c->req->param('note_id');
	my $deleted_rows_count = $self->delete_note($note_id);
	if ($deleted_rows_count != 1) {
		my $error_messages = ['$deleted_rows_count is ' . $deleted_rows_count];
		return $c->render_json({note_id => $note_id, error_messages => $error_messages});
	} else {
		return $c->render_json({note_id => $note_id});
	}
};

sub db {
	my $self = shift;

	if (!defined($self->{_db})) {
		$self->{_db} = KossyNote::Model->new(connect_info => [
			'dbi:mysql:kossynote',
			'YourUserName',
			'YourPassword',
			{ mysql_enable_utf8 => 1 },
		]);
	}
	return $self->{_db};
}

sub create_note {
	my ($self, $text) = @_;
	$text = "" if !defined $text;
	my $row = $self->db->insert('notes', {
			text => $text,
			created_at => $self->current_time,
		});
	return \%{$row->get_columns};
}

sub note_list {
	my $self = shift;
	my $itr = $self->db->search('notes', {}, {
			order_by => {'note_id' => 'DESC'},
		});

	my @rows;
	while (my $row = $itr->next) {
		push(@rows, $row->get_columns);
	}
	return \@rows;
}

sub update_note {
	my ($self, $note_id, $text) = @_;
	$text = '' if !defined $text;
	my $db = $self->db;
	my $update_row_count = $db->update('notes',
		{
			text => $text,
		},
		{
			note_id => $note_id,
		},
	);
	my $row = $db->single('notes', {
			note_id => $note_id,
		});
	return \%{$row->get_columns};
}

sub delete_note {
	my ($self, $note_id) = @_;
	if (!defined($note_id)) {
		return -1;
	}
	my $deleted_rows_count = $self->db->delete('notes', {
			note_id => $note_id,
		});
	return $deleted_rows_count;
}

sub current_time {
	my ($self) = @_;
	return DateTime->now(time_zone => 'Asia/Tokyo');
}

1;

