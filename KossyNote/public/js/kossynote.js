$(document).ready(function() {

	var ksNotes = $('#ks-notes');

	ksNotes.addClass('ks-notes');
	ksNotes.append(
		'<table class="table table-striped">' +
		'<thead><tr><th class="col-md-9">text</th><th class="col-md-2">created_on</th><th class="col-md-1"></th></tr></thead>' +
		'<tbody class="ks-list"></tbody></table>'
	);

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
				// debugPrint('Error searching notes.');
			}
		}
	});

	// create 
	$('#ks-create').on('click', function() {
		var text = createForm.find('.text-input').val();
		if (!text)
			return;

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
					// debugPrint('Error adding note.');
				}
			},
			dataType: 'json',
		});
	}

	// update
	var textBeforeEdit = '';
	$(ksList).on('dblclick', '.ks-row', function() {
		// debugPrint('ks-row dblclicked');

		var existingInput = $(ksList).find('.ks-row-input');
		if (existingInput) {
			existingInput.parent().text(textBeforeEdit);
			existingInput.remove();
		}

		var noteId = $(this).attr('id');
		var textTd = $(this).children('td:first');
		var noteText = textTd.text();

		textBeforeEdit = noteText;
		textTd.text('');

		$('<textarea class="col-md-8 ks-row-input" rows="4">' + htmlEscape(noteText).replace(/\"/g, /*"*/ '&quot;') + '</textarea>').appendTo(textTd).keypress(function(e) {
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
		// debugPrint('delete-button clicked');
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
				// debugPrint("success in delete: " + data.note_id);
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
		// debugPrint('refreshNoteList notes.length: ' + notes.length);
		
		ksList.empty();
		for (var i = 0; i < notes.length; i++) {
			var str = '';
			str += '<tr id="' + notes[i].note_id + '" class="ks-row">';
			str += '<td>' + htmlEscape(notes[i].text) + '</td>';
			str += '<td><small class="text-muted">' + htmlEscape(notes[i].created_on) + '</small></td>';
			str += '<td><span class="delete-button"><i class="icon-remove-sign"></i></span></td></tr>';

			ksList.append(str);
		}
	}

	function htmlEscape(string) {
		if (!string) return;
		return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}	


	//====== Debug =============================================================//

	/*
	function debugPrint(str) {
		var	area = $('#debug');
		if (!area) return;
		area.val(area.val() + str + '\n');
	}
	*/

	//===========================================================================//
});
