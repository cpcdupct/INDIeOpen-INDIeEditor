var indievideo = indievideo || {};

indievideo.version = "b.0.0.1";

indievideo.strings = {};

indievideo.plugins = {};

indievideo.video = {};

indievideo.utils = {};

indievideo.api = {};

indievideo.currentVideo = {
    videosource: undefined,
    data: []
};

indievideo.containers = {
    tree: undefined,
    video: undefined,
    actions: undefined
};

indievideo.init = function (video, containers) {
    indievideo.plugins.preparePlugins();

    if (!containers.hasOwnProperty('tree') || !containers.hasOwnProperty('video') || !containers.hasOwnProperty('actions')) throw new Error('Ooops! Containers must be set.');
    if (!video.videosource) throw new Error("Ooops! It's mandatory to provide a videosource in order to run the plugin");
    if (!video.hasOwnProperty('data')) throw new Error("Ooops! treeData and videoData fields are missing in video object");
    if (video.data.length == 0) {
        var rootNode = indievideo.rootElement();
        video.data = [rootNode];
    }

    indievideo.containers = containers;

    indievideo.currentVideo = video;

    indievideo.video.loadVideo();
    indievideo.loadTree();
};

indievideo.instance = undefined;

indievideo.ICON_LOOP = 'fa fa-undo';

indievideo.ICON_ELEMENT = 'fa fa-genderless';

indievideo.selectedElement = undefined;

indievideo.isRootElementSelected = function () {
    return (this.selectedElement && (this.selectedElement.id == indievideo.currentVideo.data[0].id));
};

indievideo.getInstance = function () {
    return $(this.instance).jstree(true);
};

indievideo.loadTree = function () {
    var actionsButtons = indievideo.plugins.renderTemplate('<div id="actions"> <button type="button" class="btn btn-success btn-sm" onclick="indievideo.api.createElement();"><i class="fa fa-plus"></i> {{translate "schema.buttons.create"}}</button> <button type="button" class="btn btn-warning btn-sm" onclick="indievideo.api.renameElement();"><i class="fa fa-edit"></i> {{translate "schema.buttons.rename"}}</button> <button type="button" class="btn btn-danger btn-sm" onclick="indievideo.api.deleteElement();"><i class="fa fa-times"></i> {{translate "schema.buttons.delete"}}</button> </div>', {});
    var schemaContainer = indievideo.plugins.renderTemplate('<div data-ivid="schema-container" class="schema-container"></div>', {});

    var html = actionsButtons.concat(schemaContainer);
    $(indievideo.containers.tree).append(html);

    var schemaDom = document.querySelector('[data-ivid="schema-container"]');
    this.instance = $(schemaDom).jstree({
        core: {
            check_callback: true,
            data: indievideo.currentVideo.data,
            multiple: false
        },
        plugins: ["unique"]
    });

    $(schemaDom).on('select_node.jstree', function (e, data) {
        indievideo.loadData(data.node.id);
        indievideo.selectedElement = indievideo.findTreeData(data.node.id);
        var timetab = document.getElementById('one-tab');
        $(timetab).click();
    });

    $(schemaDom).on('loaded.jstree', function (e) {
        indievideo.getInstance().select_node(indievideo.currentVideo.data[0].id);
        indievideo.selectedElement = indievideo.currentVideo.data[0];
    });
};

indievideo.emptyElement = function (type, text) {
    var node = {};
    node.id = indievideo.utils.generate_uuid();
    node.type = type;
    node.data = {
        start: undefined,
        end: undefined,
        text: undefined,
        coordinates: [],
        aux_coord: []
    };

    if (type == 'loop') {
        node.icon = this.ICON_LOOP;
        node.children = [];
        node.text = (text) ? text : indievideo.strings.labels.newLoop + "-" + indievideo.utils.generate_uuid(true);
    } else if (type == 'element') {
        node.icon = this.ICON_ELEMENT;
        node.text = (text) ? text : indievideo.strings.labels.newElement + "-" + indievideo.utils.generate_uuid(true);
    }

    return node;
};

indievideo.rootElement = function () {
    return indievideo.emptyElement('loop', 'Initial node');
};

indievideo.create = function (type) {
    var node = indievideo.emptyElement(type);
    var parNode = (this.getInstance().get_selected(true).length == 0) ? this.getInstance().get_node(indievideo.currentVideo.data[0]).id : this.getInstance().get_selected(true)[0];
    this.getInstance().create_node(parNode, node, 'last', function () {
        var parentData = indievideo.findTreeData(parNode.id);
        parentData.children.push(node);
        indievideo.loadData(parentData.id);
    });
};

indievideo.rename = function () {
    var sel = this.getInstance().get_selected(true)[0];
    this.getInstance().edit(sel, sel.text, function (node) {
        var treedata = indievideo.findTreeData(node.id);
        treedata.text = node.text;
        indievideo.loadData(node.id);
    });
};

indievideo.delete = function () {
    var sel = this.getInstance().get_selected(true)[0];
    var nodeId = sel.id;
    this.getInstance().delete_node(sel);
    this.deleteTreeData(nodeId);
    indievideo.getInstance().select_node(indievideo.currentVideo.data[0]);
    indievideo.utils.notifySuccess(indievideo.strings.messages.titles.ok, indievideo.strings.messages.msg.nodeDeleted);
};


indievideo.findTreeData = function (dataId) {
    var recursiveFind = function (data, dataId) {
        if (data.id == dataId)
            return data;
        else if (data.type == 'loop') {
            var result;
            for (var i = 0; result == undefined && i < data.children.length; i++)
                result = recursiveFind(data.children[i], dataId);

            return result;
        }

        return undefined;
    };

    var dataFound = undefined;

    for (var i = 0; i < indievideo.currentVideo.data.length; i++) {
        var treeData = indievideo.currentVideo.data[i];
        dataFound = recursiveFind(treeData, dataId);
        if (dataFound) break;
    }

    return dataFound;
};

indievideo.deleteTreeData = function (dataId) {
    var rootNode = indievideo.currentVideo.data[0];

    var recursiveDelete = function (elementsArray, dataId) {
        for (var i = 0; i < elementsArray.length; i++) {
            var element = elementsArray[i];

            if (element.id == dataId) {
                elementsArray.splice(i, 1);
                return true;
            } else if (element.type == 'loop') {
                if (recursiveDelete(element.children, dataId))
                    return true;
            }
        }

        return false;
    }

    return recursiveDelete(rootNode.children, dataId);
};

indievideo.loadData = function (id) {
    var treeData = indievideo.findTreeData(id);
    if (!treeData) return false;

    var inputstart = indievideo.containers.actions.querySelector('[data-input="start"]');
    var inputEnd = indievideo.containers.actions.querySelector('[data-input="end"]');
    var tabList = document.getElementById('tab-list');

    if (treeData.data.start)
        inputstart.value = treeData.data.start;
    else
        inputstart.value = "";

    if (treeData.data.end)
        inputEnd.value = treeData.data.end;
    else
        inputEnd.value = "";

    if (treeData.type == 'loop') {
        $(tabList.children[1]).show();

        var areasTemplate =
            '{{#if isEmpty}} <tr><td colspan="3">{{translate "actions.content.areas.noAreaFound"}}</td></tr> {{/if}}  {{#each areas}}<tr data-areaid="{{id}}"><td>{{text}}</td>' +
            '{{#_isEmpty data.text id}}<td><button class="btn btn-sm btn-primary" id="addtextmodal" onclick="indievideo.video.addtextmodal(\'{{id}}\');"><i id="iconmodal" class="fa fa-edit"></i></button></td>{{/_isEmpty}}' +
            '{{#equals data.coordinates.length "0" id}}<td><button class="btn btn-sm btn-primary" id="addArea" onclick="indievideo.video.newArea(\'{{id}}\');"><i id="areaIcon" class="fa fa-plus-square"></i></button>' +
            '<button id="viewArea" onclick="indievideo.video.viewAreaInteractive(\'{{id}}\', false)" class="btn btn-sm btn-info" style="visibility: hidden;"><i id="viewIcon" class="fa fa-eye"></i></button></td>{{/equals}}</tr>{{/each}}';

        var tableInteractiveAreas = indievideo.containers.actions.querySelector('[data-input="interactiveAreas"]');
        $(tableInteractiveAreas).empty();
        $(tableInteractiveAreas).append(indievideo.plugins.renderTemplate(areasTemplate, {
            areas: treeData.children,
            isEmpty: (treeData.children.length == 0)
        }));
    } else {
        $(tabList.children[1]).hide();
    }
};

indievideo.saveCurrentElement = function () {
    var inputstart = indievideo.containers.actions.querySelector('[data-input="start"]');
    var startTime = inputstart.value;

    var inputEnd = indievideo.containers.actions.querySelector('[data-input="end"]');
    var endTime = inputEnd.value;

    if (!indievideo.utils.validateTimeMark(startTime) || !indievideo.utils.validateTimeMark(endTime)) {
        indievideo.utils.notifyError(indievideo.strings.messages.titles.oops, indievideo.strings.messages.msg.timeFormat);
        return;
    }

    if (indievideo.utils.markTimeGreaterThan(startTime, endTime)) {
        indievideo.utils.notifyError(indievideo.strings.messages.titles.oops, indievideo.strings.messages.msg.starTimeAfterEndTime);
    } else {
        indievideo.selectedElement.data.start = startTime;
        indievideo.selectedElement.data.end = endTime;
        indievideo.utils.notifySuccess(indievideo.strings.messages.titles.ok, indievideo.strings.messages.msg.dataSaved);
    }
};

indievideo.validateContent = function (showMsg) {
    var validateItem = function (item) {
        if (!item.data.start || !item.data.end)
            return false;

        if (item.type == 'element') {
            if (item.data.coordinates.length == 0)
                return false;
        }

        if (item.type == 'loop') {
            for (var i = 0; i < item.children.length; i++) {
                var element = item.children[i];
                if (!validateItem(element))
                    return false;
            }
        }

        return true;
    };

    var rootNode = indievideo.currentVideo.data[0];
    var result = validateItem(rootNode);

    if (!result && showMsg == true) indievideo.utils.notifyError(indievideo.strings.messages.titles.atention, indievideo.strings.messages.msg.notValid);

    return result;
}

indievideo.saveInteractiveArea = function (arrayArea, id) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    objChildren.data.coordinates.push(arrayArea);
};

indievideo.saveAreaDrawn = function (aux_array, id) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    objChildren.data.aux_coord.push(aux_array);
};

indievideo.getAreaDrawn = function (id) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    return objChildren.data.aux_coord.join();
}

indievideo.emptyArray = function (id, option) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    if (option == 1) {
        objChildren.data.aux_coord = [];
    } else {
        objChildren.data.coordinates = [];
    }
};

indievideo.saveTextModal = function (id, text) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    objChildren.data.text = text;
};
indievideo.video.instance = undefined;

indievideo.video.loadVideo = function () {
    var videoControl = indievideo.containers.video.querySelector('.video-control');
    var playpauseButton = videoControl.querySelector('[data-control="playpause"]');
    var currentTimeSpan = videoControl.querySelector('[data-control="currentTime"]');
    var finalTime = videoControl.querySelector('[data-control="finalTime"]');
    var progressBar = videoControl.querySelector('[data-control="progress-bar"]');

    var playpauseFunctionHandler = function () {
        if (iavideoInstance.isPaused())
            iavideoInstance.play();
        else
            iavideoInstance.pause();
    }

    var ontimeupdate = function () {
        currentTimeSpan.innerHTML = indievideo.utils.formatTime(iavideoInstance.currentTime(), 100);

        var percentage = (100 / iavideoInstance.duration()) * iavideoInstance.currentTime();
        var progress = progressBar.children[0];
        progress.value = percentage;
    }

    var onprogressbarclicked = function (e) {
        var percent = e.offsetX / this.offsetWidth;
        iavideoInstance.seCurrentTime(percent * iavideoInstance.duration());
        var progress = progressBar.children[0];
        progress.value = percent * 100;
    }

    var onvideoended = function () {
        currentTimeSpan.innerHTML = indievideo.utils.formatTime(iavideoInstance.duration(), 100);
    }

    var changeTime = function () {
        var progress = progressBar.children[0];
        var progressValue = (progress.value / 100);
        var completeTime = progressValue * iavideoInstance.duration();
        iavideoInstance.seCurrentTime(completeTime);
        currentTimeSpan.innerHTML = indievideo.utils.formatTime(completeTime);

    }

    var instanceReady = function () {
        playpauseButton.addEventListener('click', playpauseFunctionHandler);
        progressBar.addEventListener('click', onprogressbarclicked);
        progressBar.children[0].addEventListener('change', changeTime);
    }

    var iavideoInstance = iavideo({
        sources: indievideo.currentVideo.videosource,
        isInteractive: false,
        onReady: instanceReady,
        onTimeUpdate: ontimeupdate,
        onEnded: onvideoended
    });

    indievideo.video.instance = iavideoInstance;
    iavideoInstance.instance().addEventListener("durationchange", function () {
        finalTime.innerHTML = indievideo.utils.formatTime(iavideoInstance.duration(), 100);
    });
};


indievideo.video.initCanvas = function (id) {
    var containerCanvas = document.querySelector(".video-player");
    if (document.getElementById("canvas" + id) <= 0) {
        var node = document.createElement("CANVAS");
        node.setAttribute("id", "canvas" + id);
        node.setAttribute("class", "canvas");
        containerCanvas.appendChild(node);
    }

    var canvas = document.querySelector("canvas[id='canvas" + id + "']");
    var context = canvas.getContext("2d");
    var currentFeature;

    context.fillStyle = '#7d0502';
    context.lineWidth = '4';

    var features = [indievideo.video.rectangleFeature(context, canvas)];
    var featuresDictionary = {};
    for (var f in features) {
        var feature = features[f];
        featuresDictionary[feature.name] = feature;
    }

    function removeFeature(feature) {
        canvas.removeEventListener("mousedown", feature.onmousedown);
        canvas.removeEventListener("mousemove", feature.onmousemove);
        canvas.removeEventListener("mouseup", feature.onmouseup);
    }

    function addFeature(feature) {
        canvas.addEventListener("mousedown", feature.onmousedown);
        canvas.addEventListener("mousemove", feature.onmousemove);
        canvas.addEventListener("mouseup", feature.onmouseup);
    }

    function setMode(mode) {
        if (currentFeature) {
            removeFeature(currentFeature);
        }

        currentFeature = mode;
        addFeature(currentFeature);
    }

    setMode(featuresDictionary["Rectangle"]);

    var prop_player = indievideo.containers.video.querySelector('video');
    var prop_canvas = document.querySelector("canvas[id='canvas" + id + "']");
    var size_w = prop_player.clientWidth;
    var size_h = prop_player.clientHeight;

    prop_canvas.width = size_w;
    prop_canvas.height = size_h;
};

var w, h, l, t, t2, l2, w2, h2;

indievideo.video.rectangleFeature = function (context, canvas) {
    var isMouseDown = false;
    var startLocation;
    var imageBefore;

    var onmousedown = function (event) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        isMouseDown = true;
        imageBefore = context.getImageData(0, 0, canvas.width, canvas.height);

        var p = indievideo.utils.getPixelFromEvent(event);
        startLocation = p;
        context.beginPath();
    };

    var onmousemove = function (event) {
        context.globalAlpha = 0.3;
        if (!isMouseDown) {
            return;
        }
        var p = indievideo.utils.getPixelFromEvent(event);
        context.putImageData(imageBefore, 0, 0);
        context.beginPath();
        context.rect(startLocation.x, startLocation.y, p.x - startLocation.x, p.y - startLocation.y);
        context.closePath();
        context.fill();
        context.stroke();
    };

    var onmouseup = function (event) {
        isMouseDown = false;
        var p = indievideo.utils.getPixelFromEvent(event);
        var prop_player = indievideo.containers.video.querySelector('video');
        l = startLocation.x;
        t = startLocation.y;
        w = p.x - startLocation.x;
        h = p.y - startLocation.y;

        t2 = ((t * 100) / prop_player.clientHeight).toFixed(1);
        l2 = ((l * 100) / prop_player.clientWidth).toFixed(1);
        w2 = ((w * 100) / prop_player.clientWidth).toFixed(1);
        h2 = ((h * 100) / prop_player.clientHeight).toFixed(1);

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        context.rect(l, t, w, h);
        context.fillStyle = "#88EF5E";
        context.stroke();
        context.fill();

    };

    return {
        name: "Rectangle",
        onmousedown: onmousedown,
        onmousemove: onmousemove,
        onmouseup: onmouseup
    };
};

indievideo.video.viewAreaInteractive = function (id, allvision) {
    var canvas = document.getElementById("canvas" + id);
    var context = canvas.getContext("2d");
    var interactiveAreas = document.querySelector("[data-input='interactiveAreas']");
    var rowinteractive = interactiveAreas.querySelector('[data-areaid="' + id + '"]');
    var viewinteractive = rowinteractive.querySelector("#viewArea");
    var iconinteractive = rowinteractive.querySelector("#viewIcon");
    var btnshowcanvas = document.querySelector("#viewCanvas");
    var iconshowcanvas = document.querySelector("#iconCanvas");
    var l_, t_, w_, h_;
    var info_array = indievideo.getAreaDrawn(id);
    info_array = info_array.split(",", info_array.length);
    l_ = info_array[0];
    t_ = info_array[1];
    w_ = info_array[2];
    h_ = info_array[3];

    if (window.getComputedStyle(viewinteractive).visibility === "visible") {
        if (viewinteractive.classList.contains("btn-info")) {
            viewinteractive.classList.remove("btn-info");
            viewinteractive.classList.add("btn-danger");
            iconinteractive.classList.remove('fa-eye');
            iconinteractive.classList.add('fa-eye-slash');

            context.beginPath();
            context.globalAlpha = 0.3;
            context.rect(l_, t_, w_, h_);
            context.fillStyle = "#88EF5E";
            context.fill();
            if (allvision) {
                btnshowcanvas.classList.remove("btn-info");
                btnshowcanvas.classList.add("btn-warning");

                iconshowcanvas.classList.remove('fa-eye');
                iconshowcanvas.classList.add('fa-eye-slash');
            }
        } else if (!allvision) {
            viewinteractive.classList.add("btn-info");
            viewinteractive.classList.remove("btn-danger");
            iconinteractive.classList.add('fa-eye');
            iconinteractive.classList.remove('fa-eye-slash');

            if (btnshowcanvas.classList.contains('btn-warning')) {
                btnshowcanvas.classList.remove("btn-warning");
                btnshowcanvas.classList.add("btn-info");
                iconshowcanvas.classList.remove('fa-eye-slash');
                iconshowcanvas.classList.add('fa-eye');
            }
            context.clearRect(l_, t_, w_, h_);
        }
    }
};

indievideo.video.disablebtn = function (nodeList, options) {
    for (i = 0; i < nodeList.length; i++) {
        nodeList[i].style.pointerEvents = options;
    }
};

indievideo.video.newArea = function (id) {
    var rowinteractive = indievideo.containers.actions.querySelector('[data-areaid="' + id + '"]');
    var btninteractive = rowinteractive.querySelector("#addArea");
    var viewinteractive = rowinteractive.querySelector("#viewArea");
    var iconinteractive = rowinteractive.querySelector("#areaIcon");
    var viewIcon = rowinteractive.querySelector("#viewIcon");

    indievideo.video.initCanvas(id);
    var canvas = document.getElementById("canvas" + id);
    var interactiveAreas = document.querySelector("[data-input='interactiveAreas']");
    var tr = interactiveAreas.querySelectorAll('tr:not([data-areaid="' + id + '"])');

    if (btninteractive.classList.contains('btn-primary')) {
        canvas.style.pointerEvents = "auto";
        btninteractive.classList.remove('btn-primary');
        btninteractive.classList.add('btn-warning');
        iconinteractive.classList.remove('fa-plus-square');
        iconinteractive.classList.add('fa-exclamation-triangle');
        indievideo.video.disablebtn(tr, "none");

    } else if (btninteractive.classList.contains('btn-warning')) {
        var arrayAreas = [];
        var aux_arrayAreas = [];

        if (l == 0 && t == 0 && w == 0 && h == 0 || typeof l === 'undefined') {
            canvas.style.pointerEvents = "none";
            btninteractive.classList.add('btn-primary');
            btninteractive.classList.remove('btn-warning');
            iconinteractive.classList.add('fa-plus-square');
            iconinteractive.classList.remove('fa-exclamation-triangle');
            indievideo.video.disablebtn(tr, "auto");
        } else {
            btninteractive.classList.remove('btn-warning');
            btninteractive.classList.add('btn-success');
            iconinteractive.classList.remove('fa-exclamation-triangle');
            iconinteractive.classList.add('fa-check');
            viewinteractive.style.visibility = 'visible';
            canvas.style.pointerEvents = "none";

            indievideo.emptyArray(id, 1);
            indievideo.emptyArray(id, 2);
            arrayAreas.push(l2 + '%', t2 + '%', w2 + '%', h2 + '%');
            aux_arrayAreas.push(l, t, w, h);
            indievideo.saveInteractiveArea(arrayAreas, id);
            indievideo.saveAreaDrawn(aux_arrayAreas, id);
            indievideo.video.disablebtn(tr, "auto");
            l = 0, t = 0, w = 0, h = 0;
            l2 = 0, t2 = 0, w2 = 0, h2 = 0;
        }
    } else if (btninteractive.classList.contains('btn-success')) {
        canvas.style.pointerEvents = "auto";
        viewinteractive.style.visibility = 'hidden';
        btninteractive.classList.remove('btn-success');
        btninteractive.classList.add('btn-warning');
        iconinteractive.classList.remove('fa-check');
        iconinteractive.classList.add('fa-exclamation-triangle');

        viewinteractive.classList.add("btn-info");
        viewinteractive.classList.remove("btn-danger");
        viewIcon.classList.add('fa-eye');
        viewIcon.classList.remove('fa-eye-slash');

        indievideo.video.disablebtn(tr, "none");
    }
};

indievideo.video.viewCanvas = function () {
    var interactiveAreas = document.querySelector("[data-input='interactiveAreas']");
    var tr = interactiveAreas.querySelectorAll('tr');
    var btnshowareas = document.querySelector('#viewCanvas');
    var canvass = document.querySelectorAll(".canvas");
    var container_idcanvas = [];
    canvass.forEach(function (e) {
        container_idcanvas.push(e.id.split("canvas")[1]);
    });
    var container_idtr = [];
    tr.forEach(function (e) {
        container_idtr.push(e.attributes[0].nodeValue);
    });
    if (btnshowareas.classList.contains('btn-info')) {
        console.log("MSG: Area/s del canvas mostrado/s");
        for (i = 0; i < container_idtr.length; i++) {
            if (container_idcanvas.includes(container_idtr[i])) {
                indievideo.video.viewAreaInteractive(container_idtr[i], true);
            } else {
                console.log("ERROR: Canvas '" + container_idtr[i] + "' no localizado en el area.");
            }
        }
    } else {
        console.log("MSG: Area/s del canvas ocultado/s");
        for (i = 0; i < container_idtr.length; i++) {
            if (container_idcanvas.includes(container_idtr[i])) {
                indievideo.video.viewAreaInteractive(container_idtr[i], false);
            }
        }
    }
};

indievideo.video.addtextmodal = function (id) {
    var objChildren = indievideo.utils.findObjectInArray(indievideo.selectedElement.children, 'id', id);
    var textModal = objChildren.data.text;
    bootprompt.prompt({
        title: "Introduce el texto: ",
        placeholder: 'Options',
        value: textModal,
        callback: function (result) {
            indievideo.saveTextModal(id, result);
            var rowinteractive = indievideo.containers.actions.querySelector('[data-areaid="' + id + '"]');
            var btnmodal = rowinteractive.querySelector("#addtextmodal");
            btnmodal.classList.add('btn-success');
            btnmodal.classList.remove('btn-primary');
        }
    });
};
indievideo.plugins.preparePlugins = function () {
    Handlebars.registerHelper('_isEmpty', function (a, id, options) {
        if (a === "" || typeof a === 'undefined') {
            return options.fn(this);
        }
        aux_html = '<td><button class="btn btn-sm btn-success" id="addtextmodal" onclick="indievideo.video.addtextmodal(' + "'" + id + "'" + ');"><i id="iconmodal" class="fa fa-edit"></i></button></td>';
        return aux_html;
    });

    Handlebars.registerHelper('equals', function (a, b, id, options) {


        if (a <= b) {
            var canvas = document.getElementById("canvas" + id);
            if (canvas) canvas.style.pointerEvents = "none";
            return options.fn(this);
        } else if (a > b) {
            var aux_html = '<td><button class="btn btn-sm btn-success" id="addArea" onclick="indievideo.video.newArea(' + "'" + id + "'" + ');"><i id="areaIcon" class="fa fa-check"></i></button>' +
                '<button id="viewArea" onclick="indievideo.video.viewAreaInteractive(' + "'" + id + "'" + ', false)" class="btn btn-sm btn-info" style="visibility: visible;"><i id="viewIcon" class="fa fa-eye"></i></button></td>';
            var containerCanvas = document.querySelector(".video-player");
            var canvas = document.querySelector("canvas[id='canvas" + id + "']");

            if (canvas <= 0){
                var prop_player = document.getElementsByClassName("video-player");
                var node = document.createElement("CANVAS");
                node.setAttribute("id", "canvas" + id);
                node.setAttribute("class", "canvas");
                node.style.pointerEvents = "none";
                node.setAttribute("width", prop_player[0].clientWidth); 
                node.setAttribute("height", prop_player[0].clientHeight); 
                containerCanvas.appendChild(node);
                canvas = document.querySelector("canvas[id='canvas" + id + "']");
            }
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            return aux_html;
        }
    });

    Handlebars.registerHelper('translate', function (jsonPathQuery) {
        var translation = jsonpath.query(indievideo.strings, "$." + jsonPathQuery);
        return new Handlebars.SafeString(translation);
    });

    $("body").tooltip({
        trigger: 'hover',
        selector: "[data-toggle='tooltip']",
    });
};

indievideo.plugins.renderTemplate = function (template, model) {
    var templateInstance = Handlebars.compile(template);
    var html = templateInstance(model);
    return html;
};
indievideo.api.createElement = function () {
    if (indievideo.selectedElement && (indievideo.selectedElement.type == 'loop')) {
        bootprompt.prompt({
            size: "small",
            title: indievideo.strings.messages.titles.typeElement,
            inputType: "select",
            inputOptions: [{
                text: indievideo.strings.labels.element,
                value: 'element'
            }, {
                text: indievideo.strings.labels.loop,
                value: 'loop'
            }],
            callback: function (result) {
                if (result) {
                    indievideo.create(result);
                } else {
                    indievideo.utils.notifyWarning(indievideo.strings.messages.titles.atention, indievideo.strings.messages.msg.noElementType);
                }
            }
        });
    } else {
        indievideo.utils.notifyWarning(indievideo.strings.messages.titles.atention, indievideo.strings.messages.msg.addToLoop);
    }
};

indievideo.api.renameElement = function () {
    if (indievideo.selectedElement) {
        indievideo.rename();
    } else {
        indievideo.utils.notifyWarning(indievideo.strings.messages.titles.oops, indievideo.strings.messages.msg.nodeFirst)
    }
};

indievideo.api.deleteElement = function () {
    if (indievideo.selectedElement) {
        if (indievideo.isRootElementSelected()) {
            indievideo.utils.notifyWarning(indievideo.strings.messages.titles.oops, indievideo.strings.messages.msg.deleteRootNode)
            return;
        }

        bootprompt.confirm({
            title: '<i class="fa fa-exclamation-triangle red"></i> ' + indievideo.strings.messages.titles.sure,
            message: indievideo.strings.messages.msg.deleteSure,
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-info'
                }
            },
            callback: function (result) {
                if (result) {
                    indievideo.delete();
                }
            }
        });
    }
};

indievideo.api.save = function () {
    indievideo.saveCurrentElement();
};

indievideo.api.takeTime = function (targetTime) {
    var input;

    if (targetTime == 0) input = indievideo.containers.actions.querySelector('[data-input="start"]');
    else if (targetTime == 1) input = indievideo.containers.actions.querySelector('[data-input="end"]');

    input.value = indievideo.utils.formatTime(indievideo.video.instance.currentTime());
}

indievideo.api.getData = function (success, error) {
    if (indievideo.api.validateContent()) {
        success(indievideo.currentVideo.data);
    } else {
        error();
    }
}

indievideo.api.validateContent = function (showMsg) {
    return indievideo.validateContent(showMsg);
}
indievideo.utils.generate_uuid = function (short) {
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    if (short)
        return s4();
    else
        return s4() + s4() + s4();
}

indievideo.utils.notifySuccess = function (title, message) {
    toastr.success(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}

indievideo.utils.notifyError = function (title, message) {
    toastr.error(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}

indievideo.utils.notifyWarning = function (title, message) {
    toastr.warning(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}

indievideo.utils.markTimeGreaterThan = function (startTime, endTime) {
    var getMiliseconds = function (timeMarkSt) {
        var matchArray = indievideo.utils.markTimePattern.exec(timeMarkSt);
        var minutes = parseInt(matchArray[1]);
        var seconds = parseInt(matchArray[2]);
        var miliseconds = parseInt(matchArray[3]);
        return miliseconds + (seconds * 1000) + (minutes * 60 * 1000);
    }


    var startTimeMs = getMiliseconds(startTime);
    var endTimeMs = getMiliseconds(endTime);

    return (startTimeMs >= endTimeMs);
}

indievideo.utils.markTimeER = "([0-9]*[0-9]):([0-5][0-9]):([0-9]{3})";
indievideo.utils.markTimePattern = new RegExp(indievideo.utils.markTimeER);

indievideo.utils.validateTimeMark = function (timeMark) {
    return this.markTimePattern.test(timeMark);
};

indievideo.utils.findObjectInArray = function (array, key, value) {
    var index = this.findIndexObjectInArray(array, key, value);
    if (index != -1)
        return array[index];
    return undefined;
}

indievideo.utils.findIndexObjectInArray = function (array, key, value) {
    for (var i = 0; i < array.length; i++) {
        var element = array[i];
        if (element[key] == value)
            return i;
    }

    return -1;
}

indievideo.utils.formatTime = function (seconds, guide) {
    var d = seconds.toFixed(3).toString().split(".")[1];
    var s = Math.floor(seconds % 60);
    var m = Math.floor(seconds / 60 % 60);

    if (isNaN(seconds) || seconds === Infinity) {
        m = s = '-';
    }

    m = m + ':';

    s = (s < 10) ? '0' + s : s;

    d = ":" + d;

    return m + s + d;
}

indievideo.utils.fromTimeMark = function (markTime) {
    var matchArray = indievideo.utils.markTimePattern.exec(markTime);
    var minutes = parseInt(matchArray[1]);
    var seconds = parseInt(matchArray[2]);
    var miliseconds = parseInt(matchArray[3]);
    return (minutes * 60 + seconds) + "." + (miliseconds);
}

indievideo.utils.getPixelFromEvent = function (event) {
    if (event.offsetX) {
        return {
            x: event.offsetX,
            y: event.offsetY
        };
    } else if (event.layerX) {
        return {
            x: event.layerX,
            y: event.layerY
        };
    }
    return {
        x: 0,
        y: 0
    };
}