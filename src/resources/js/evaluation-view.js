// Unit questions
var questions = model.instance.evaluation;

// Evaluation instance
var evaluation = evaluationEditor('#questions-container', questions);

// Current type adding question
var currentType = undefined;

// Array of selected questions
var questionSelected = [];
var searchedQuestions = [];
var tagSelected;
var groupKeySelected;

// Question bank
var questionBank = [];
var allTags = [];
var allGroups = [];

var randomUnit = {
    single: 0,
    multiple: 0,
    trueFalse: 0
};

$(function () {
    $('#modal-add-question').on('hidden.bs.modal', function () {
        $('.selected-questions').empty();
        $('.search-questions').empty();
        questionSelected = [];
        $('#modal-add-question').modal('dispose');
    });

    $('#modal-random').on('hidden.bs.modal', function () {
        $('input[name=single]').val(0);
        $('input[name=multiple]').val(0);
        $('input[name=trueFalse]').val(0);
        $('#randomForm').addClass('hide');
        $('#numRandomQuestions').html(0);
        $('#modal-random').modal('dispose');
    });

    $('#modal-loading-content').modal(modalOptionsShow);
    $('#modal-loading-content').on('shown.bs.modal', function () {
        init();
    });
});

function init() {
    $.getJSON(getQuestionUrl, function (data) {
        questionBank = data.questions;

        data.questions.forEach(function (question) {
            if (question.type == 'SingleAnswer') randomUnit.single++;
            else if (question.type == 'MultipleAnswer') randomUnit.multiple++;
            else if (question.type == 'TrueFalse') randomUnit.trueFalse++;

            allTags = allTags.concat(question.tags);

            if (!isGroupContainedInGroups(allGroups, question.group))
                allGroups.push(question.group);
        });

        allTags = allTags.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        $('#modal-loading-content').modal('hide');
        notifySuccess(translate('common.ok'), translate('evaluation.messages.content_loaded'));
    });
}

function isGroupContainedInGroups(groups, currentGroup) {
    if (currentGroup == undefined) return false;

    return findObjectInArray(groups, 'key', currentGroup.key) != undefined;
}

function drawQuestions(questionsToDraw) {
    $('.search-questions').empty();

    if (questionsToDraw.length == 0) {
        $('.search-questions').append(
            '<div class="list-group-item">' + translate('evaluation.no_results') + '</div>'
        );
    } else {
        questionsToDraw.forEach(function (question) {
            searchedQuestions.push(question);
            var item = createQuestion(question);
            $('.search-questions').append(item);
        });
    }
}

function findQuestionsByType(type) {
    return questionBank.filter(function (question) {
        return question.type == type;
    });
}

function findQuestionsByTypeAndTag(type, tag) {
    return questionBank.filter(function (question) {
        return question.type == type && question.tags.indexOf(tag) != -1;
    });
}

function findQuestionsByTypeAndGroupKey(type, groupKey) {
    return questionBank.filter(function (question) {
        return question.type == type && question.group.key == groupKey;
    });
}

function findQuestiosnByTypeGroupKeyAndTag(type, tag, groupKey) {
    return questionBank.filter(function (question) {
        return (
            question.type == type &&
            question.group.key == groupKey &&
            question.tags.indexOf(tag) != -1
        );
    });
}

function addQuestion(type) {
    $('#tags-container').empty();
    $('#groups-container').empty();

    $('#modal-add-question .modal-title').html(translate('evaluation.messages.new_question'));
    $('#modal-add-question').modal('show');
    $('.search-questions').append(
        '<div class="list-group-item"> <i class="fa fa-2x fa-spinner fa-spin"></i></div>'
    );

    currentType = type;
    var questionsByType = findQuestionsByType(type);
    drawQuestions(questionsByType);

    var tags = [];
    var groups = [];

    questionsByType.forEach(function (question) {
        tags = tags.concat(question.tags);

        if (!isGroupContainedInGroups(groups, question.group)) groups.push(question.group);
    });

    tags = tags.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });

    tags.forEach(function (tag) {
        $('#tags-container').append(
            '<span class="badge badge-info m-1 category" onclick="searchTag(event)">' +
                tag +
                '</span>'
        );
    });

    groups.forEach(function (group) {
        $('#groups-container').append(
            '<span class="badge badge-primary m-1 group" onclick="searchGroup(event)" data-key="' +
                group.key +
                '">' +
                group.name +
                '</span>'
        );
    });
}

function searchTag(e) {
    searchedQuestions = [];
    $('.search-questions').empty();
    $('.search-questions').append(
        '<div class="list-group-item"> <i class="fa fa-2x fa-spinner fa-spin"></i></div>'
    );

    if ($(e.srcElement).hasClass('selected')) {
        $('.category.selected').removeClass('selected');
        tagSelected = undefined;
        if (groupKeySelected)
            drawQuestions(findQuestionsByTypeAndGroupKey(currentType, groupKeySelected));
        else drawQuestions(findQuestionsByType(currentType));
    } else {
        var tag = $(e.srcElement).html();
        $('.category.selected').removeClass('selected');
        $(e.srcElement).addClass('selected');
        tagSelected = tag;
        if (groupKeySelected)
            drawQuestions(findQuestiosnByTypeGroupKeyAndTag(currentType, tag, groupKeySelected));
        else drawQuestions(findQuestionsByTypeAndTag(currentType, tag));
    }
}

function searchGroup(e) {
    searchedQuestions = [];
    $('.search-questions').empty();
    $('.search-questions').append(
        '<div class="list-group-item"> <i class="fa fa-2x fa-spinner fa-spin"></i></div>'
    );

    if ($(e.srcElement).hasClass('selected')) {
        $('.group.selected').removeClass('selected');
        groupKeySelected = undefined;
        if (tagSelected) drawQuestions(findQuestionsByTypeAndTag(currentType, tagSelected));
        else drawQuestions(findQuestionsByType(currentType));
    } else {
        var groupElement = $(e.srcElement);
        var groupKey = $(groupElement).data('key');
        groupKeySelected = groupKey;
        $('.group.selected').removeClass('selected');
        $(e.srcElement).addClass('selected');
        if (tagSelected)
            drawQuestions(
                findQuestiosnByTypeGroupKeyAndTag(currentType, tagSelected, groupKeySelected)
            );
        else drawQuestions(findQuestionsByTypeAndGroupKey(currentType, groupKey));
    }
}

function createQuestion(questionData) {
    var item = document.createElement('div');
    item.setAttribute('class', 'list-group-item question-item');
    item.setAttribute('data-id', questionData.id);

    var text = document.createElement('h5');
    $(text).html(questionData.text);
    item.appendChild(text);

    var answerList = document.createElement('ul');
    item.appendChild(answerList);

    if (questionData.type != 'trueFalse') {
        for (var i = 0; i < questionData.answers.length; i++) {
            var answer = questionData.answers[i];
            if (answer.correct)
                $(answerList).append(
                    '<li class="correct">' + answer.text + ' <i class="fa fa-check"></i> </li> '
                );
            else $(answerList).append('<li>' + answer.text + '</li>');
        }
    } else {
        if (questionData.correct) {
            $(answerList).append(
                '<li class="correct">' +
                    translate('evaluation.messages.true') +
                    ' <i class="fa fa-check"></i></li>'
            );
            $(answerList).append('<li>false</span> <br/>');
        } else {
            $(answerList).append(
                '<li class="correct">' +
                    translate('evaluation.messages.false') +
                    ' <i class="fa fa-check"></i></li>'
            );
            $(answerList).append('<li>true</span>');
        }
    }

    item.addEventListener('click', questionClick);
    return item;
}

function questionClick(e) {
    $(e.currentTarget).toggleClass('active', 200);
}

function removeQuestion() {
    var selectedQuestionsElements = $('.selected-questions .question-item.active');
    for (var i = 0; i < selectedQuestionsElements.length; i++) {
        var elementId = selectedQuestionsElements[i].getAttribute('data-id');
        var index = findIndexObjectInArray(questionSelected, 'id', elementId);
        if (index > -1) questionSelected.splice(index, 1);
    }

    $('.selected-questions .question-item.active').remove();
}

/* Add a question to the selected from the searched questions. Selected questions must be unique */
function addSearchedQuestion() {
    var alreadySelected = false;
    var currentSearchedQuestions = $('.search-questions .question-item.active');

    for (var i = 0; i < currentSearchedQuestions.length; i++) {
        var elementId = currentSearchedQuestions[i].getAttribute('data-id');
        if (!findObjectInArray(questionSelected, 'id', elementId)) {
            var questionToBeAdded = findObjectInArray(searchedQuestions, 'id', elementId);
            questionSelected.push(questionToBeAdded);

            var item = createQuestion(questionToBeAdded);
            $('.selected-questions').append(item);
        } else {
            alreadySelected = true;
        }
    }

    if (alreadySelected)
        notifyWarning(translate('common.attention'), translate('evaluation.already_selected'));
}

/* Add selected questions to evaluation unit */
function addSelectedQuestions() {
    var alreadySelected = false;
    if (questionSelected.length == 0) {
        notifyWarning(translate('common.attention'), translate('evaluation.messages.at_least_one'));
        return;
    }

    var questionsInUnit = evaluation.getQuestions();
    for (var i = 0; i < questionSelected.length; i++) {
        var question = questionSelected[i];
        if (findIndexObjectInArray(questionsInUnit, 'id', question.id) < 0)
            evaluation.addQuestion(question);
        else alreadySelected = true;
    }

    if (alreadySelected)
        notifyInfo(translate('common.info'), translate('evaluation.messages.question_already'));

    $('#modal-add-question').modal('hide');
}

function selectAll(origin) {
    $('.' + origin + '-questions .question-item').addClass('active');
}

function unselectAll(origin) {
    $('.' + origin + '-questions .question-item').removeClass('active');
}

function generateRandomUnit() {
    // Set tags
    $('#random-select-tags').empty();

    allTags.forEach(function (tag) {
        $('#random-select-tags').append('<option value="' + tag + '">' + tag + '</option>');
    });

    $('#random-select-tags').select2({
        theme: 'bootstrap4'
    });

    // Set groups
    $('#random-select-groups').empty();
    allGroups.forEach(function (group) {
        $('#random-select-groups').append(
            '<option value="' + group.key + '">' + group.name + '</option>'
        );
    });

    $('#random-select-groups').select2({
        theme: 'bootstrap4'
    });

    // Show modals
    $('#modal-random').modal('show');
    $('.loader').remove();
    $('#randomForm').removeClass('hide');

    var selectedTags = [];
    var selectedGroupKeys = [];
    var selectedTypes = [];
    var availableQuestions = 0;

    // Form listener
    var form = $('#randomForm');
    $(form).on('change', function (e) {
        selectedTags = $('#random-select-tags').val();
        selectedGroupKeys = $('#random-select-groups').val();
        selectedTypes = [];

        $.each(
            $('#random-type-checkboxes-wrapper input[type=checkbox]:checked'),
            function (i, element) {
                selectedTypes.push($(element).val());
            }
        );

        availableQuestions = calculateAvailableQuestions(
            selectedTags,
            selectedGroupKeys,
            selectedTypes
        );
        $('#available-question-label').html(availableQuestions);
        $('#random-questions-number').attr('max', availableQuestions);
    });

    $(form).on('submit', function (e) {
        e.preventDefault();

        var numberOfSelectedQuestions = parseInt($('#random-questions-number').val());

        if (numberOfSelectedQuestions > availableQuestions) {
            notifyWarning(
                translate('common.attention'),
                translate('evaluation.messages.more_than_available_questions')
            );
        } else if (numberOfSelectedQuestions == 0) {
            notifyWarning(
                translate('common.attention'),
                translate('evaluation.messages.at_least_one')
            );
        } else {
            var randomQuestions = getRandomQuestions(
                numberOfSelectedQuestions,
                selectedTags,
                selectedGroupKeys,
                selectedTypes
            );
            evaluation.clearQuestions();

            for (var i = 0; i < randomQuestions.length; i++) {
                var question = randomQuestions[i];
                evaluation.addQuestion(question);
            }

            $('#modal-random').modal('hide');
            notifySuccess(
                translate('common.success'),
                translate('evaluation.messages.generated_unit')
            );
        }
    });

    $('#modal-random').on('hidden.bs.modal', function () {
        $(form).off('change');
        $(form).off('submit');

        $('#modal-random').modal('dispose');
    });
}

function calculateAvailableQuestions(selectedTags, selectedGroupKeys, selectedTypes) {
    var availableQuestions = [];

    availableQuestions = questionBank.filter(function (question) {
        return (
            selectedTypes.includes(question.type) &&
            selectedGroupKeys.includes(question.group.key) &&
            isTagContainedIn(question.tags, selectedTags)
        );
    });

    return availableQuestions.length;
}

function getRandomQuestions(
    numberOfSelectedQuestions,
    selectedTags,
    selectedGroupKeys,
    selectedTypes
) {
    var availableQuestions = questionBank.filter(function (question) {
        return (
            selectedTypes.includes(question.type) &&
            selectedGroupKeys.includes(question.group.key) &&
            isTagContainedIn(question.tags, selectedTags)
        );
    });

    return getRandom(availableQuestions, numberOfSelectedQuestions);
}

function isTagContainedIn(tagsInQuestion, tagsArray) {
    for (let i = 0; i < tagsInQuestion.length; i++) {
        var tag = tagsInQuestion[i];
        if (tagsArray.includes(tag)) return true;
    }

    return false;
}

function submitRandomForm() {
    $('#randomForm').trigger('submit');
}

function saveUnit() {
    var currentQuestions = evaluation.getQuestions();

    if (currentQuestions.length == 0) {
        notifyWarning(translate('common.attention'), translate('evaluation.messages.empty_unit'));
        return;
    }

    model.instance.evaluation = currentQuestions;

    $('#modal-saving-content').modal(modalOptionsShow);
    $('#modal-saving-content').on('shown.bs.modal', function (e) {
        $.ajax({
            url: saveUnitUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                questions: currentQuestions
            }),
            success: function (data) {
                $('#modal-saving-content').modal('hide');
                notifySuccess(
                    translate('common.success'),
                    translate('evaluation.messages.saved_successfully')
                );
            },
            error: function (err) {
                $('#modal-saving-content').modal('hide');
                notifyError(translate('common.error'), translate('common.internal_error'));
            }
        });
    });

    $('#modal-saving-content').on('hidden.bs.modal', function (e) {
        $('#modal-saving-content').modal('dispose');
    });
}

function preview() {
    var currentQuestions = evaluation.getQuestions();

    if (currentQuestions.length == 0) {
        notifyWarning(translate('common.warning'), translate('evaluation.messages.preview_empty'));
        return;
    }

    model.instance.evaluation = currentQuestions;

    $('#modal-saving-content').modal(modalOptionsShow);
    $('#modal-saving-content').on('shown.bs.modal', function (e) {
        $.ajax({
            url: saveUnitUrl,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                questions: currentQuestions
            }),
            success: function (data) {
                $('#modal-saving-content').modal('hide');
                notifySuccess(
                    translate('common.success'),
                    translate('evaluation.messages.saved_successfully')
                );


                $('#modal-generating-preview').modal(modalOptionsShow);
                $('#modal-generating-preview').on('shown.bs.modal', function (e) {
                    $.ajax({
                        url: previewUnitUrl,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(model),
                        success: function (response) {
                            $('#modal-generating-preview').modal('hide');
                            window.open(response.url, '_blank');

                            $('#modal-preview-generated-url').html(response.url);
                            $('#modal-preview-generated-url').attr('href', response.url);
                            $('#modal-preview-generated').modal(modalOptionsShowAllowClose);

                            $('#modal-preview-generated').on('hidden.bs.modal', function (err) {
                                $('#modal-preview-generated').modal('dispose');
                            });
                        },
                        error: function (err) {
                            $('#modal-generating-preview').modal('hide');
                            notifyError(translate('common.error'), translate('common.internal_error'));
                        }
                    });
                });

                $('#modal-generating-preview').on('hidden.bs.modal', function (e) {
                    $('#modal-generating-preview').modal('dispose');
                });

            },
            error: function (err) {
                $('#modal-saving-content').modal('hide');
                notifyError(translate('common.error'), translate('common.internal_error'));
            }
        });
    });

    $('#modal-saving-content').on('hidden.bs.modal', function (e) {
        $('#modal-saving-content').modal('dispose');
    });

    
}
