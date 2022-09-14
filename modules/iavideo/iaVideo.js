var iavideo = (function (data) {
    var css_classes = {
        CONTAINER: "iavideo-container",
        VIDEO: 'iavideo',
        ANSWER: 'iavideo-answer',
        CLICKABLE: 'iavideo-clickable',
        PLAY: 'iavideo-play',
        PLAY_IMAGE: 'iavideo-play-image'
    }

    var videoContainer;

    var videoElement;


    var questions = [];

    var currentQuestion;

    var selected;

    var selectedOption = 0;

    var mobile = false;

    var GO_BACK = -1;

    var END_VIDEO = -2;

    var azureMediaPlayer;


    function _seek(time) {
        azureMediaPlayer.currentTime(time);
        if (azureMediaPlayer.paused()) azureMediaPlayer.play();
    }

    function _play() {
        azureMediaPlayer.play();
    }

    function _pause() {
        azureMediaPlayer.pause();
    }

    function _currentTime() {
        return azureMediaPlayer.currentTime();
    }

    function _setCurrentTime(time) {
        azureMediaPlayer.currentTime(time);
    }

    function _duration() {
        return azureMediaPlayer.duration();
    }

    function _isPaused() {
        return azureMediaPlayer.paused();
    }

    var _isMobile = {
        Android: function () {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function () {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function () {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function () {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function () {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function () {
            return (_isMobile.Android() || _isMobile.BlackBerry() || _isMobile.iOS() || _isMobile.Opera() || _isMobile.Windows());
        }
    };

    function hasClass(el, className) {
        return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
    }

    function addClass(el, className) {
        if (!hasClass(el, className))
            el.className += " " + className;
    }

    function getData(element, dataName) {
        return element.getAttribute("data-" + dataName);
    }

    function setData(element, dataName, dataValue) {
        element.setAttribute("data-" + dataName, dataValue);
    }

    function removeElement(element) {
        if (element) element.parentNode.removeChild(element);
    }

    function removeElements(arrayOfElements) {
        for (var i = 0; i < arrayOfElements.length; i++) {
            removeElement(arrayOfElements[i]);
        }
    }

    function _createId() {
        var s4 = function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };

        return s4() + s4() + s4();
    }

    function _markInteractiveElements() {
        var markQuestion = function (question) {
            question._id = _createId();

            if (question.type == 'loop') {
                for (var j = 0; j < question.options.length; j++) {
                    var option = question.options[j];
                    option._id = _createId();
                }
            }
        }

        for (var i = 0; i < questions.length; i++) {
            var question = questions[i];
            markQuestion(question);
        }
    }

    function _getParent(element) {
        var parentContainsElement = function (question, element) {
            for (var j = 0; j < question.options.length; j++) {
                if (question.options[j]._id == element._id)
                    return true;
            }

            return false;
        }

        if (element.type == 'option') {
            for (var i = 0; i < questions.length; i++) {
                var question = questions[i];
                if (parentContainsElement(question, element))
                    return question;
            }
        } else {
            return false;
        }
    }

    function _createOption(option, index) {
        var divOption = document.createElement('div');

        addClass(divOption, css_classes.ANSWER);
        addClass(divOption, css_classes.CLICKABLE);

        setData(divOption, 'type', 'option');
        setData(divOption, 'id', index);

        divOption.style.left = option.sizes.left;
        divOption.style.top = option.sizes.top;
        divOption.style.width = option.sizes.width;
        divOption.style.height = option.sizes.height;

        if (option.text) {
            addClass(divOption, 'default');
            var span = document.createElement('span');
            span.innerHTML = option.text.content;

            if (option.text.class) addClass(span, option.text.class);
            else addClass(span, "default-text");

            divOption.appendChild(span);
        }

        return divOption;
    }

    function _selectAndShowQuestion(question) {
        var touchClickElementFunction = function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            selected.shown = false;
            question.shown = false;
            removeElements(videoContainer.querySelectorAll('[data-type="option"]'));

            var selectedOption = parseInt(getData(this, 'id'));
            selected = question.options[selectedOption];

            _seek(selected.start);

            _showSkipOption();
        }

        question.shown = true;

        for (var i = 0; i < question.options.length; i++) {
            var option = question.options[i];
            var element = _createOption(option, i);
            if (mobile) element.addEventListener('touchstart', touchClickElementFunction);
            else element.addEventListener('click', touchClickElementFunction);
            videoContainer.appendChild(element);
        }
    }

    function _showSkipOption() {
        if (selected.skip && selected.nextQuestion == GO_BACK) {
            var skipClickTouchFunction = function (e) {
                removeElement(videoContainer.querySelector('[data-type="skip"]'));
                goBack = false;
                _seek(questions[currentQuestion].start);
            }

            var option = questions[currentQuestion].options[selectedOption];
            var divOption = document.createElement('div');
            addClass(divOption, css_classes.ANSWER);
            addClass(divOption, css_classes.CLICKABLE);
            setData(divOption, 'type', 'skip');

            divOption.style.left = option.skip.left;
            divOption.style.top = option.skip.top;
            divOption.style.width = option.skip.width;
            divOption.style.height = option.skip.height;

            if (mobile) divOption.addEventListener('touchstart', skipClickTouchFunction);
            else divOption.addEventListener('click', skipClickTouchFunction);

            videoContainer.appendChild(divOption);
        }
    }

    function _interactiveTimeUpdate(e) {
        var time = _currentTime();
        if (selected.type == 'loop') {
            if (time >= selected.start && !selected.shown) {
                _selectAndShowQuestion(selected);
            } else if (time >= selected.end && selected.shown) {
                _seek(selected.start);
            }
        } else if (selected.type == 'segment') {
            if (time >= selected.end) {
                selected = questions[selected.jumpTo];
                _seek(selected.start);
            }
        } else if (selected.type == 'option') {
            if (time >= selected.end) {
                if (selected.nextQuestion == GO_BACK) {
                    selected = _getParent(selected)
                    _seek(selected.start);
                } else if (selected.nextQuestion == END_VIDEO) {
                    _resetVideo();
                } else {
                    selected = questions[selected.nextQuestion];
                    _seek(selected.start);
                }
            }
        } else if (selected.type == 'end') {
            if (time >= selected.end) {
                _resetVideo();
            }
        }
    }

    function _startInteractive() {
        azureMediaPlayer.play();
        if (data.isInteractive)
            selected = questions[0];
    }

    function _resetVideo() {
        _pause();
        _setCurrentTime(0);
        currentQuestion = 0;
        goBack = false;
        endVideo = false;
        selectedOption = 0;

        var playDiv = document.createElement('div');
        addClass(playDiv, css_classes.PLAY);
        var playImg = document.createElement('img');
        playImg.src = defaultData.playButton;
        addClass(playImg, css_classes.PLAY_IMAGE);
        playDiv.appendChild(playImg);

        playDiv.addEventListener('click', function () {
            removeElement(playDiv);
            _startInteractive();
        });

        videoContainer.appendChild(playDiv);
    }

    function _httpGetAsync(theUrl, successCallback, errorCallback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.overrideMimeType("application/json");
        xmlHttp.open("GET", theUrl, true); 

        xmlHttp.onreadystatechange = function (oEvent) {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    successCallback(xmlHttp.response);
                } else {
                    errorCallback(xmlHttp.statusText);
                }
            }
        };

        xmlHttp.send(null);
    }

    var defaultData = {
        isInteractive: true,
        imagePreview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAwCAIAAAAU+VQ7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAD3SURBVFhH7ZVbDsIgFETZ/6+PnWhdgdZdicGMt8OlgrwSQnJ+OkyY3kdac3xc2zBQ0mldHLN7ORj0sTYzKYchk2gX6/GuiaQQ8gUlZAvx7R4kKD7wADJIyPlJkhKshPRIyAbIljAnugiQLcT8luegJCV1P56uX6Pz80ZKEbrWZHtKyj5yGBKyda2pEnr3/PIh/jxSsbZNEtQiIMZh7E5XWmsiqya8rwqZ//xr0FEMCTVlNpl3bycpk/knTOJwv1jw2LAmNy5SfTBY0uPh3bPIYzoC0hOJnkRKCHcFiSGUpEo0StK755PUpRDDdc/SL8mNpAibm9flBaAgmwqGG8B9AAAAAElFTkSuQmCC',
        playButton: 'data:image/png;base64,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'
    }

    function setup(data) {
        _setUpSelector(data);

        if (!data.hasOwnProperty('isInteractive')) data.isInteractive = defaultData.isInteractive;

        mobile = _isMobile.any();

        if (data.externalSource) {
            _setupVideoFromExternalSource(data);
        } else {
            _setupVideo(data);
        }
    }

    function _setUpSelector(data) {
        var selector = (data.hasOwnProperty('selector')) ? data.selector : '.' + css_classes.CONTAINER;
        var dom = document.querySelector(selector);
        if (!dom) throw Error("The selector does not select any DOM element");
        videoContainer = dom;
        addClass(videoContainer, css_classes.CONTAINER);
    }

    function _setupVideo(data) {
        if (!data.sources) throw Error("The video sources must be set");

        videoElement = document.createElement('video');
        videoElement.setAttribute("class", "azuremediaplayer amp-default-skin amp-big-play-centered");
        videoElement.controls = false;
        addClass(videoElement, css_classes.VIDEO);
        videoContainer.appendChild(videoElement);

        azureMediaPlayer = amp(videoElement, {
            autoplay: false,
            controls: false,
            logo: {
                enabled: false
            },
            fluid: true,
            width: "auto",
            height: "100%"
        }, function () {
            if (data.hasOwnProperty('onReady')) data.onReady();

            var playDiv = document.createElement('div');
            addClass(playDiv, css_classes.PLAY);
            var playImg = document.createElement('img');
            playImg.src = defaultData.playButton;
            addClass(playImg, css_classes.PLAY_IMAGE);
            playDiv.appendChild(playImg);

            playDiv.addEventListener('click', function () {
                removeElement(playDiv);
                _startInteractive();
            });

            videoContainer.appendChild(playDiv);
        });

        azureMediaPlayer.src([data.sources]);


        if (data.hasOwnProperty('onError')) azureMediaPlayer.addEventListener('error', function (e) {
            data.onError('Error in html5 video player', e)
        });

        if (data.hasOwnProperty('onEnded')) azureMediaPlayer.addEventListener('ended', data.onEnded);
        if (data.hasOwnProperty('onTimeUpdate')) azureMediaPlayer.addEventListener('timeupdate', data.onTimeUpdate);

        if (data.isInteractive) {
            azureMediaPlayer.addEventListener('ended', function () {
                _resetVideo(data);
            });

            if (!data.questions) throw Error("You must specify chocies for the interactive video");
            azureMediaPlayer.addEventListener('timeupdate', _interactiveTimeUpdate);
            questions = data.questions;
            _markInteractiveElements();
        }

    }

    function _setupVideoFromExternalSource(data) {
        var onSuccess = function (responseText) {
            var jsonResponse = JSON.parse(responseText);
            if (jsonResponse.hasOwnProperty('sources') && jsonResponse.hasOwnProperty('questions')) {
                data.sources = jsonResponse.sources;
                data.questions = jsonResponse.questions;
                _setupVideo(data);
            } else
                data.onError('The information loaded in the json is not valid. Check the data.', jsonResponse);
        };

        var onError = function (msg) {
            data.onError(msg);
        };

        _httpGetAsync(data.externalSource, onSuccess, onError);
    }

    setup(data);

    return {
        play: _play,
        pause: _pause,
        currentTime: _currentTime,
        seCurrentTime: _setCurrentTime,
        duration: _duration,
        isPaused: _isPaused,
        seek: _seek,
        instance: function () {
            return azureMediaPlayer;
        }
    };
});