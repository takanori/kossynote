// $(function() {
	// $('#create-form').submit(function() {
		// createForm = this;
		// $.ajax({
			// type: 'POST',
			// url: createForm.action,
			// data: $(createForm).serialize(),
			// success: function(data) {
				// location.href = data.location;
			// },
			// error: function() {
				// alert('error');
			// },
			// dataType: 'json',
		// });
		// return false;
	// });
// });

$(document).ready(function() {

	var ksNotes = $('#ks-notes');

	ksNotes.addClass('ks-notes');
	ksNotes.append(
		'<input type="text" class="ks-input">' +
		'<table class="table table-striped">' +
		'	<thead><tr><th class="col-md-10">text</th><th class="col-md-1">created_on</th><th class="col-md-1">buttons</th></tr></thead>' +
		'	<tbody class="ks-list"></tbody>'
	);

	var ksInput = ksNotes.children('.ks-input');
	var ksList = ksNotes.find('.ks-list');

	var rawNotes = [];
	var createForm = $('#create-form');

	$.ajax({
		type: 'GET',
		url: '/search',
		success: function(data) {
			if (data) {
				rawNotes = data;
				refreshNoteList(rawNotes);
			} else {
				debugPrint('Error searching notes.');
			}
		}
	});

	// create 
	$('#ks-create').on('click', function() {
		debugPrint('submit clicked');
	
		addNewNote(createForm.serialize());
	});

	function addNewNote(noteData) {
		$.ajax({
			type: 'POST',
			url: '/create',
			data: noteData,
			success: function(savedData) {
				if (savedData) {
					rawNotes.unshift(savedData);
					refreshNoteList(rawNotes);
				} else {
					debugPrint('Error adding note.');
				}
			},
			dataType: 'json',
		});
	}

	// update
	var textBeforeEdit = '';
	$(ksList).on('dblclick', '.ks-row', function() {
		debugPrint('ks-row dblclicked');

		var existingInput = $(ksList).find('.ks-row-input');
		if (existingInput) {
			existingInput.parent().text(textBeforeEdit);
			existingInput.remove();
		}

		var noteId = $(this).attr('id');
		var textTd = $(this).children('td:first');
		var noteText = textTd.text();

		// if (!noteText)
			// return;

		textBeforeEdit = noteText;
		textTd.text('');

		$('<input type="text" class="ks-row-input value="' + htmlEscape(noteText).replace(/\"/g, /*"*/ '&quot;') + '">').appendTo(textTd).keypress(function(e) {

			if (e.keyCode != 13)
				return;

			// Update note
			var ksRowInput = $(this);
			var newText = ksRowInput.val();

			if (!newText)
				return;

			$.ajax({
				type: 'POST',
				url: '/update',
				data: {
					note_id: noteId,
					text: newText,
				},
				success: function(updatedNote) {
					if (updatedNote) {
						updateCache(updatedNote);
						refreshNoteList(rawNotes);
					}
				},
			});
			
			ksRowInput.val('');
		}).focus();
	});

	// delete
	$(ksList).on('click', '.delete-button', function() {
		debugPrint('delete-button clicked');
		var noteId = $(this).parent().parent().attr('id');
		deleteNote(noteId);
	});

	function deleteNote(noteId) {
		if (!noteId)
			return;
		$.ajax({
			type: 'DELETE',
			url: '/delete',
			data: {
				note_id : noteId,
			}, 
			success: function(data) {
				debugPrint("success in delete: " + data.note_id);
				deleteCache(data.note_id);
				refreshNoteList(rawNotes);
			},
		});
	}

	function deleteCache(noteId) {
		for (var i = 0; i < rawNotes.length; i++) {
			if (rawNotes[i].note_id == noteId) {
				rawNotes.splice(i, 1);
				break;
			}
		}
	}

	function updateCache(note) {
		for (var i = 0; i < rawNotes.length; i++) {
			if (rawNotes[i].note_id == note.note_id) {
				rawNotes[i] = note;
				break;
			}
		}
	}

	function refreshNoteList(notes) {
		debugPrint('refreshNoteList notes.length: ' + notes.length);
		
		ksList.empty();
		for (var i = 0; i < notes.length; i++) {
			var str = '';
			str += '<tr id="' + notes[i].note_id + '" class="ks-row">';
			str += '<td>' + htmlEscape(notes[i].text) + '</td>';
			str += '<td>' + htmlEscape(notes[i].created_on) + '</td>';
			str += '<td><span class="delete-button"><i class="icon-remove-sign"></i></span></td></tr>';

			ksList.append(str);
		}
	}

	function htmlEscape(string) {
		if (!string) return;
		return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}	


	//====== Debug =============================================================//

	function debugPrint(str) {
		var	area = $('#debug');
		if (!area) return;
		area.val(area.val() + str + '\n');
	}

	//===========================================================================//
});
