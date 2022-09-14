var evaluationEditor = function (containerSelector, dataQuestions) {
    // Editor info
    var questions = [];
    var container = undefined;
    var drake = undefined;

    // Fixed info
    var css = {
        questionContainer: 'questions-container',
        dragItem: 'drag-item',
    };

    // Computed info
    var dataset = false;

    function setup(setContainerSelector, setDataQuestions) {
        questions = setDataQuestions;
        container = document.querySelector(setContainerSelector);

        for (var i = 0; i < questions.length; i++) {
            createViewElement(questions[i]);
        }

        drake = dragula([], {
            isContainer: function (el) {
                return $(el).hasClass(css.questionContainer);
            },
            copy: function (el, source) {
                return false;
            },
            accepts: function (el, target) {
                return true;
            },
            moves: function (el, scontainer, handle) {
                return $(handle).hasClass(css.dragItem);
            },
            invalid: function (el) {
                return false;
            },
            removeOnSpill: false,
        });

        drake.on('drop', function (el, target) {
            var itemMoved = getData(el, 'id');
            var targetChildren = [].slice.call(target.children).map(function (ch) {
                return getData(ch, 'id');
            });

            var oldIndex = getIndexOf(itemMoved);
            var newIndex = targetChildren.indexOf(itemMoved, 0);

            array_move(questions, oldIndex, newIndex);
        });
    }

    function addQuestion(questionData) {
        createViewElement(questionData);
        questions.push(questionData);
    }

    function createViewElement(questionData) {
        // Base Div
        var questionDiv = document.createElement('div');
        questionDiv.setAttribute('class', 'question');
        setData(questionDiv, 'id', questionData.id);

        // First div
        var firstDiv = document.createElement('div');
        $(firstDiv).append('<i class="fa fa-2x fa-question-circle drag-item"></i>');

        // Second div
        var secondDiv = document.createElement('div');
        $(secondDiv).append('<p>' + questionData.text + '</p>');

        // Third div
        var thirdDiv = document.createElement('div');

        var buttonView = document.createElement('button');
        buttonView.setAttribute('class', 'btn btn-sm btn-info');
        $(buttonView).append('<i class="fa fa-eye"></i>');
        buttonView.addEventListener('click', viewQuestionAction);

        var buttonRemove = document.createElement('button');
        buttonRemove.setAttribute('class', 'btn btn-sm btn-danger');
        $(buttonRemove).append('<i class="fa fa-times"></i>');
        buttonRemove.addEventListener('click', removeQuestionAction);

        thirdDiv.appendChild(buttonView);
        thirdDiv.appendChild(buttonRemove);

        // Append divs
        questionDiv.appendChild(firstDiv);
        questionDiv.appendChild(secondDiv);
        questionDiv.appendChild(thirdDiv);

        container.appendChild(questionDiv);
    }

    function removeQuestionAction(e) {
        e.preventDefault();
        var questionWrapper = e.currentTarget.parentNode.parentNode;
        var itemId = getData(questionWrapper, 'id');
        var indexOfItem = getIndexOf(itemId);
        if (indexOfItem > -1) {
            questions.splice(indexOfItem, 1);
            $(questionWrapper).hide(300, function () {
                $(this).remove();
            });
        }
    }

    function viewQuestionAction(e) {
        e.preventDefault();
        var questionWrapper = e.currentTarget.parentNode.parentNode;
        var itemId = getData(questionWrapper, 'id');
        var questionData = getQuestion(itemId);
        if (questionData) {
            var html = '';
            html += '<p>' + questionData.text + '</p>';
            html += '<ul>';

            if (questionData.type != 'trueFalse') {
                for (var i = 0; i < questionData.answers.length; i++) {
                    if (questionData.answers[i].correct)
                        html +=
                            '<li><strong>' +
                            questionData.answers[i].text +
                            '</strong> ' +
                            translate('evaluation.messages.correct_par') +
                            '</li>';
                    else html += '<li>' + questionData.answers[i].text + '</li>';
                }
            } else {
                if (questionData.correct) {
                    html += '<li>' + translate('evaluation.messages.true_correct') + '</li>';
                    html += '<li>' + translate('evaluation.messages.false') + '</li>';
                } else {
                    html += '<li>' + translate('evaluation.messages.false_correct') + '</li>';
                    html += '<li>' + translate('evaluation.messages.true') + '</li>';
                }
            }

            html += '</ul>';

            bootprompt.alert({
                title: translate('evaluation.messages.viewing_question'),
                message: html,
            });
        }
    }

    function clearQuestions() {
        $(container).empty();
        questions = [];
    }

    function getIndexOf(id) {
        for (var i = 0; i < questions.length; i++) {
            var question = questions[i];
            if (question.id == id) return i;
        }
    }

    function getQuestion(item) {
        var indexOfItem = getIndexOf(item);
        if (indexOfItem > -1) return questions[indexOfItem];

        return undefined;
    }

    // UTILS AND POLYFILL
    function browserCapabilities() {
        if (Modernizr.dataset) dataset = true;
    }

    function getData(element, dataName) {
        if (!dataset) return element.getAttribute('data-' + dataName);
        return element.dataset[dataName];
    }

    function setData(element, dataName, dataValue) {
        if (!dataset) element.setAttribute('data-' + dataName, dataValue);
        else element.dataset[dataName] = dataValue;
    }

    function array_move(arr, old_index, new_index) {
        if (new_index >= arr.length) {
            var k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    }

    // INITIALIZE
    browserCapabilities();
    setup(containerSelector, dataQuestions);

    return {
        getQuestions: function () {
            return questions;
        },
        addQuestion: addQuestion,
        clearQuestions: clearQuestions,
    };
};
