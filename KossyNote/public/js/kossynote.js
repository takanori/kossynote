$(document).ready(function() {

	var ksNotes = $('#ks-notes');

	ksNotes.addClass('ks-notes');
	ksNotes.append(
		'<table class="table table-striped">' +
		'<thead><tr><th class="col-md-9">text</th><th class="col-md-2">created_at</th><th class="col-md-1"></th></tr></thead>' +
		'<tbody class="ks-list"></tbody></table>'
	);

	var ksList = ksNotes.find('.ks-list');
	var rawNotes = [];
	var createForm = $('#create-form');

	$.ajax({
		type: 'GET',
		url: '/search',
		success: function(data) {
			if (data.notes) {
				rawNotes = data.notes;
				refreshNoteList(rawNotes);
			} else {
				// debugPrint('Error searching notes.');
			}
		}
	});

	// intro =========================================================================

	var ksHelp = $('#ks-help');
	ksHelp.bind('click', function() {
		startIntro();
	});

	var intro;
	function startIntro(step) {
		intro = introJs();

		intro.setOptions({
			steps: [
				{
					element: document.querySelectorAll('.ks-row')[0].querySelector('td'),
					intro: 'Double click here to update the text.',
				},
				{
					element: document.querySelectorAll('.delete-btn')[0],
					intro: 'Click this button to delete the entry',
					position: 'left',
				},
			]
		});

		intro.onexit(function() {
			intro = null;
		});

		intro.start();
		return intro;
	}

	// error messages =======================================================================

	var ksError = $('#error-messages');
	function refreshErrorMessages(messages) {
		ksError.empty();
		for (var i = 0; i < messages.length; i++) {
			ksError.append(
				'<div class="alert alert-error">' +
				'	<button type="button" class="close" data-dismiss="alert">x</button>' + messages[i] +
				'</div>'
			);
		}
	}

	// create =======================================================================

	var textInput = createForm.find('.text-input');
	$('#ks-create').on('click', function() {
		if (!textInput.val())
			return;

		addNewNote(createForm.serialize());
		textInput.focus();
	});

	function addNewNote(noteData) {
		$.ajax({
			type: 'POST',
			url: '/create',
			data: noteData,
			success: function(data) {
				if (data.error_messages) {
					refreshErrorMessages(data.error_messages);
					return;
				}
				if (data.note) {
					rawNotes.unshift(data.note);
					refreshNoteList(rawNotes);
					textInput.val("");
				}
			},
			dataType: 'json',
		});
	}

	// update =======================================================================

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

		var updateTextArea = $('<textarea class="col-xs-12 ks-row-input" rows="4">' + htmlEscape(noteText).replace(/\"/g, /*"*/ '&quot;') + '</textarea>');
		updateTextArea.appendTo(textTd).focus();
	
		var submitBtn = $('<input type="button" class="update-btn btn btn-primary btn-xs" name="submit-update" value="Submit">').on('click', function() {

			// Update note
			var ksRowInput = $(this).siblings('.ks-row-input');
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
				success: function(data) {
					if (data.error_messages) {
						refreshErrorMessages(data.error_messages);
						return;
					}
					if (data.note) {
						updateCache(data.note);
						refreshNoteList(rawNotes);
					}
				},
			});
			
			ksRowInput.val('');
			textInput.focus();

			if (intro) {
				intro.exit();
			}
		});
		updateTextArea.after(submitBtn);

		if (intro) {
			intro.refresh();
		}
	});

	function updateCache(note) {
		for (var i = 0; i < rawNotes.length; i++) {
			if (rawNotes[i].note_id == note.note_id) {
				rawNotes[i] = note;
				break;
			}
		}
	}

	// delete =======================================================================

	$(ksList).on('click', '.delete-btn', function() {
		// debugPrint('delete-btn clicked');
		var noteId = $(this).parent().parent().attr('id');
		deleteNote(noteId);

		if (intro) {
			intro.exit();
		}
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
				if (data.error_messages) {
					refreshErrorMessages(data.error_messages);
					return;
				}
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

	// helper ========================================================================

	function refreshNoteList(notes) {
		// debugPrint('refreshNoteList notes.length: ' + notes.length);
		
		ksList.empty();
		for (var i = 0; i < notes.length; i++) {
			var str = '';
			str += '<tr id="' + notes[i].note_id + '" class="ks-row">';
			str += '<td>' + htmlEscape(notes[i].text) + '</td>';
			str += '<td><small class="text-muted">' + htmlEscape(notes[i].created_at) + '</small></td>';
			str += '<td><span class="delete-btn"><i class="icon-remove-sign"></i></span></td></tr>';

			ksList.append(str);
		}

		if (notes.length === 0) {
			ksHelp.hide();
		} else if (ksHelp.is(':hidden')) {
			ksHelp.show();
		}
	}

	function htmlEscape(string) {
		if (!string) return;
		return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}	


	// debug ========================================================================

	/*
	function debugPrint(str) {
		var	area = $('#debug');
		if (!area) return;
		area.val(area.val() + str + '\n');
	}
	*/
});
