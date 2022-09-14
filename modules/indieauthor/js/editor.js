var widgetsJson = [{
    "category": "simpleElements",
    "widgets": [{
        "widget": "TextBlock",
    },
    {
        "widget": "Blockquote",
    },
    {
        "widget": "LatexFormula",
    },
    {
        "widget": "Video",
    },
    {
        "widget": "SimpleImage"
    }
    ]
},
{
    "category": "layouts",
    "widgets": [{
        "widget": "ColumnLayout",
    }]
}, {
    "category": "containers",
    "widgets": [{
        "widget": "TabsContainer",
    },
    {
        "widget": "AcordionContainer",
    },
    {
        "widget": "Modal"
    }
    ]
},
{
    "category": "interactiveElements",
    "widgets": [{
        "widget": "ImageAndText",
    },
    {
        "widget": "Image",
    },
    {
        "widget": "ChooseOption",
    },
    {
        "widget": "DragdropContainer",
    },

    {
        "widget": "TrueFalseContainer"
    },
    {
        "widget": "AnimationContainer",
    },
    {
        "widget": "AudioTermContainer",
    },
    {
        "widget": "ImageAndSoundContainer"
    },
    {
        "widget": "CouplesContainer"
    },
    {
        "widget": "SchemaContainer"
    },
    {
        "widget": "InteractiveVideo"
    },
    {
        "widget": "Puzzle"
    },
    {
        "widget": "CorrectWord"
    },
    {
        "widget": "MissingWords"
    },
    {
        "widget": "SentenceOrderContainer"
    },
    {
        "widget": "GuessWord"
    },
    {
        "widget": "ButtonTextContainer"
    },
    {
        "widget": "Animation"
    }, 
    {
        "widget": "TermClassification"
    }
    ]
},
{
    "category": "exerciseElement",
    "widgets": [{
        "widget": "Test",
    }]
}
];
var indieauthor = indieauthor || {}

indieauthor.version = "1.10.0";

indieauthor.widgets = {};

indieauthor.model = {};

indieauthor.undoredo = {};

indieauthor.transform = {};

indieauthor.strings = {};

indieauthor.plugins = {};

indieauthor.api = {};

indieauthor.icons = {};

indieauthor.drake = undefined;

indieauthor.palette = undefined;

indieauthor.container = undefined;


indieauthor.init = function (palette, container, initCallBack) {
    indieauthor.plugins.preparePlugins();
    indieauthor.plugins.dependencies(container);
    indieauthor.polyfill.setBrowserCapabilities();

    indieauthor.loadWidgets(palette);

    indieauthor.palette = palette;
    indieauthor.container = container;

    indieauthor.drake = dragula([], {
        isContainer: function (el) {
            return $(el).hasClass('dragula-container');
        },
        copy: function (el, source) {
            return (source == palette);
        },
        accepts: function (el, target) {
            return indieauthor.accept(el, target);
        },
        moves: function (el, subContainer, handle) {
            return $(handle).hasClass('drag-item') || $(el).hasClass('palette-item');
        },
        invalid: function (el) {
            return $(el).hasClass('dragula-anchor');
        },
        removeOnSpill: false
    });

    indieauthor.drake.on('drop', function (el, target, source, sibling) {
        indieauthor.drop(el, target, source, sibling);
    });

    if (initCallBack) initCallBack();
}

indieauthor.configure = function () {
    indieauthor.plugins.preparePlugins();
    indieauthor.polyfill.setBrowserCapabilities();
}

indieauthor.drop = function (el, target, source, sibling) {
    if (!target) return;

    var elementType = indieauthor.polyfill.getData(el, 'type'); 
    var widget = indieauthor.polyfill.getData(el, 'widget'); 
    var parentType = indieauthor.polyfill.getData(target, 'type'); 
    var parentContainerIndex = -1; 
    var parentContainerId = indieauthor.polyfill.getData($(target).closest('[data-id]')[0], 'id');

    if (parentType == 'layout') parentContainerIndex = indieauthor.polyfill.getData(target, 'index');

    if (indieauthor.allowGenerate(source, target)) {
        var dataElementId = indieauthor.utils.generate_uuid();
        var inPositionElementId = sibling != null ? indieauthor.polyfill.getData(sibling.firstChild, 'id') : -1;

        indieauthor.createViewElement(elementType, widget, el, dataElementId, parentType, parentContainerIndex, parentContainerId, inPositionElementId, true);

        indieauthor.undoredo.pushCommand("add", dataElementId, {
            element: jQuery.extend({}, indieauthor.model.findObject(dataElementId)),
            parentType: parentType,
            parentContainerIndex: parentContainerIndex,
            parentContainerId: parentContainerId,
            inPositionElementId: inPositionElementId,
            view: el.outerHTML
        });
    } else if (source != target) {
        indieauthor.handleMoveElementIntoContainer(el, target, sibling);
    } else if (source == target) {
        indieauthor.handleMoveElement(el, target);
    }
}

indieauthor.allowGenerate = function (source, target) {
    return (source == indieauthor.palette && (indieauthor.polyfill.getData(target, 'type') == 'section-container' || indieauthor.utils.contains(indieauthor.container, target)));
}

indieauthor.handleMoveElement = function (el, target) {
    var elementId = indieauthor.polyfill.getData(el.firstChild, 'id');
    var containerType = indieauthor.polyfill.getData(target, 'type');

    var targetChildren = [].slice.call(target.children).map(function (ch) {
        return indieauthor.polyfill.getData(ch.firstChild, 'id');
    });

    var newPosition = targetChildren.indexOf(indieauthor.polyfill.getData(el.firstChild, 'id'), 0);

    if (containerType == 'layout') {
        var containerId = indieauthor.polyfill.getData(target.parentNode.parentNode.parentNode, 'id'); 
        var containerIndex = indieauthor.polyfill.getData(target, 'index');
        var parentContainer = indieauthor.model.findObject(containerId);
        var initialPosition = indieauthor.utils.findIndexObjectInArray(parentContainer.data[containerIndex], 'id', elementId);

        indieauthor.undoredo.pushCommand('move', elementId, {
            containerType: containerType,
            containerIndex: containerIndex,
            containerId: containerId,
            initialPosition: initialPosition,
            finalPosition: newPosition
        });

        indieauthor.model.moveElementWithinContainer(elementId, newPosition, containerId, containerIndex);
    } else {
        var containerId = indieauthor.polyfill.getData(target.parentNode, 'id');
        var parentContainer = indieauthor.model.findObject(containerId);
        var initialPosition = indieauthor.utils.findIndexObjectInArray(parentContainer.data, 'id', elementId);

        indieauthor.undoredo.pushCommand('move', elementId, {
            containerType: containerType,
            containerIndex: -1,
            containerId: containerId,
            initialPosition: initialPosition,
            finalPosition: newPosition
        });

        indieauthor.model.moveElementWithinContainer(elementId, newPosition, containerId);
    }
}

indieauthor.handleMoveElementIntoContainer = function (el, target, sibling) {
    var elementId = indieauthor.polyfill.getData(el.firstChild, 'id');
    var element = indieauthor.model.findObject(elementId);
    var parentElement = indieauthor.model.findParentOfObject(elementId);
    var sourceContainerIndex = -1;
    var sourcePosition;

    if (parentElement.type == 'layout') {
        for (var i = 0; i < parentElement.data.length; i++) {
            var sourceelementIndex = indieauthor.utils.findIndexObjectInArray(parentElement.data[i], 'id', elementId);
            if (sourceelementIndex != -1) {
                sourcePosition = sourceelementIndex;
                sourceContainerIndex = i;
            }
        }
    } else {
        sourcePosition = indieauthor.utils.findIndexObjectInArray(parentElement.data, 'id', elementId);
    }

    var inPositionElementId = sibling != null ? indieauthor.polyfill.getData(sibling.firstChild, 'id') : -1;
    var containerType = indieauthor.polyfill.getData(target, 'type');
    var containerId;
    var containerIndex = -1;
    var containerPosition;

    if (containerType == 'layout') {
        containerId = indieauthor.polyfill.getData(target.parentNode.parentNode.parentNode, 'id');
        containerIndex = indieauthor.polyfill.getData(target, 'index');
        var targetContainer = indieauthor.model.findObject(containerId);
        containerPosition = indieauthor.utils.findIndexObjectInArray(targetContainer.data[containerIndex], 'id', inPositionElementId);
    } else {
        containerId = indieauthor.polyfill.getData(target.parentNode, 'id');
        var targetContainer = indieauthor.model.findObject(containerId);
        containerPosition = indieauthor.utils.findIndexObjectInArray(targetContainer.data, 'id', inPositionElementId);
    }

    indieauthor.undoredo.pushCommand('moveContainer', elementId, {
        source: {
            id: parentElement.id,
            type: parentElement.type,
            position: sourcePosition,
            index: sourceContainerIndex
        },
        target: {
            id: containerId,
            type: containerType,
            position: containerPosition,
            index: containerIndex
        },
        element: jQuery.extend({}, element),
        view: this.findElementByDataId(elementId).parentNode.outerHTML
    });

    indieauthor.model.moveElementFromContainerToAnother(elementId, inPositionElementId, containerId, containerIndex);
}

indieauthor.accept = function (element, target) {
    var originElement = $(element).hasClass('palette-item') ? element : element.firstChild;

    var itemType = indieauthor.polyfill.getData(originElement, 'type');
    var itemWidget = indieauthor.polyfill.getData(originElement, 'widget');
    var targetType = indieauthor.polyfill.getData(target, 'type');
    var targetWidget = indieauthor.polyfill.getData(target, 'widget');

    if (target != indieauthor.palette && (!indieauthor.canDrop(itemType, itemWidget, targetType, targetWidget)))
        return false;

    return (!indieauthor.utils.contains(indieauthor.palette, target) && (target !== indieauthor.palette) && !indieauthor.utils.contains(element, target));
}

indieauthor.canDrop = function (itemType, itemWidget, targetType, targetWidget) {
    if (itemType == targetType)
        return false;

    if (targetType == 'section-container' && (itemType != 'element-container' && itemType != 'specific-element'))
        return true;

    if (targetType == 'specific-container' || targetType == 'specific-element-container') {
        var containersAllowed = indieauthor.widgets[targetWidget].widgetConfig.allow;
        return (indieauthor.utils.stringIsInArray(itemWidget, containersAllowed));
    } else if (targetType == 'element-container' || targetType == 'layout' || targetType == 'simple-container') {
        var typesAllowed = indieauthor.widgets[targetWidget].widgetConfig.allow;
        return (indieauthor.utils.stringIsInArray(itemType, typesAllowed));
    }
}

indieauthor.addSection = function (sectionId, isCommand) {
    var sectionIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAA5CAYAAACS0bM2AAAACXBIWXMAAAsSAAALEgHS3X78AAAGIklEQVRoBe2aXUhcRxTHz/WjirpRaIOxKa5SYoOQuqQV7IO19iUhFWJLoA1d6GrBB180lIIWipE2XV9KVigWROKWWtpQqQZS20BLTEUakNQVQYK+uNJg0jRldU3qNlHLuTszOzuZ+7l3oZT7h2XvvTszzs8zZ+bMmQuuXLly5crV/1hKNtASHn8VALQCQB0A4PUrkmLTALAKAAsAMFkQH1t1uh+OwSU8/jIC1AUAPhtNRABgkIDGnOiTI3AJj/8sgSpzoDkEGyyIj53NtKGM4BIeP1poVGYp5YgXclpegJzGwwCV+0GpfIr9trf2J8DaXdiduQm7l2/A3mJU1jxasq0gPhax2z/bcAmPP0DAUiotgtzO45DzdmMajJEQdverGdgZ+hFg44FYGgHDdvpoCy7h8SNUgH+W23kMcnvfUAFta+MB7AS/g52hK2IL4YL4WFvW4UQwtFDe193qMHRKOEwfnQ4lh28GgDkWwQJpYEe8kD97zlEwnXYDsy+/P6pd63Hlmi1IJo8f0jow9UFmw1BPhfmQe6oBdn9aBPhjQy349O0t37P+01WX5n++ZKYJK5Zj/zUcilkFoyotSv6dsmK27r36SzTQExwOGNY1C0fWMTbdo49ZBft9/S6ERsbVb0sqLQpB7H4zrXLgzhY0z0RHe4LDhoGCIRyJPLroPc6KdnzsvY+G4PzIt+q3BUUURTlD1roQrdYwdwuK/n5o6H9mLNfKIg9cx3C6t6jrvy2pHxCuTYgPw/rpfeH2I6hZ+cvXExzWjWLMwHFWO27Lz9Bievc6YuEciTcH6f1Lc7fUvvUEhzVDPl04Et2zsY2Rh1XJLGXBeqJfsUgFfa9sY5sG69bh+IroZ1ZCKiotK1mwHhPZFrFY8/DyPeBHligjuDp6gUGwGW1u3VetMv79NegPfaFpIXyOv2M5vMZ6Mu3t7Yl7QbbGVdzZwi/0vSpZ3TyD/rJKanSvoQsXp+DKtTlYWonCZlzeSZkufDOV9nSfpxhqD3nhWFM9tL95QqsabnL78KJsI0GftfKzqVm41H+tcr9mofMj45agtIRtUH/k4HwEiIrt2KuibDKtkzVpOkLR87e+7nds4sj16Yed/PO02VAjHSEdlpYCZy2deq1J7JBtYTvYnkXJcjTOwIFDgDbBNGUaTthbSZUJoFkwsvaakhFcypHXzAW82MH2tzRnOqmwvA7YtHDP4Fa9+vkoIzjmvJjM+Y+I+VestCAjuAUGd/mGabSlZWv5VYPyYvbrJL1YLy+hl6J1VRnBTdILzGuY8TsULuZWpFdeURS2mImx7s2aJ+ml9L+jCyfGcph+MxKGUVoLesPRWulzLK8RfomdZjvw2+UlECstpLcLIJGZ2ZJtMzTyimlaWn7cCgg1O/EZXBzqU79lkLJ6PJy4af61/iBfblKsCCbhJtmmkeQV9cRbACEQCD/PVCTDN/ymz7QsKYODZDypTo/bhXn8kIwM9HZIh6WpvCXJofTR+/zZjzVTDQiHkX7toSoznVfjyKWVVXUp2FdSzP8UwhQDpDJv8/SH6UYvXG1kf79toLdDmpE2nZRNePzz1JnV7NfsuWxlv3CUnFEUJQyp4ThP1zf0tc/fPcqXrR7o7ZCeClkJv1i2F2fNhyc+MfQ/G8JONgtgV/mFe6Klhm91UAvMEhzJQKUAF6NJwHvxiNZUbFHYTrWiKBEBjE39Ey3PqZYjQl/TTRAZ7edEwHDC42+iUzIC/lPdiZ14/YnNL2OkI/jxCtsQn8HZXZgMxRikfGyCbyPyfLn64WR4buDYKQ/ZCfdncipKrIUTVzf/HKHQapw0JxFets/n8FDixfl1EZCm38JWzrhJ5BGQnc4ilGCx8EBvh6nTnoxOVkfbg6OYuz+QTNSIipBkjnqwz8MSGPoiwEnZySz6Fk4enI9ZAssYDoWHEpi7xxQ3ZoIzFS7Q1+sP8usYlamh6CgcAfRh7h5T3JgJ1rCkrtBCGFJh5IGAnCIEzPLZuKPvoZDcfRdmgjFhWqFmhRN8looJN5q4H8NtCwJxQTBVjKxjtt9qcPwlG5K7d+R9FL0F2oyy8gYRFckEW3qTSCsIduXKlStXWREA/Av6G2wpB37XkAAAAABJRU5ErkJggg==";

    var section = sectionId ? indieauthor.model.findObject(sectionId) : indieauthor.model.createSection();
    var sectionTemplate = '<div class="section-container"> <div id="sec-{{id}}" data-id="{{id}}" ><div class="section-header"><div class="b1"><img src="' + sectionIcon + '" class="section-icon" /></div><div class="b2" data-prev>{{name}}</div><div class="b3" data-toolbar><button onClick="indieauthor.swap(\'{{id}}\', 1)" class="btn btn-sm btn-info" title="{{translate "sections.moveUp"}}"><i class="fa fa-arrow-up"></i></button><button onClick="indieauthor.swap(\'{{id}}\', 0)" class="btn btn-sm btn-info" title="{{translate "sections.moveDown"}}"><i class="fa fa-arrow-down"></i></button><button class="btn btn-sm btn-success" onClick="indieauthor.openSectionSettings(\'{{id}}\')" data-toggle="tooltip"  title="{{translate "sections.edit"}}"><i class="fa fa-edit"></i></button><button class="btn btn-sm btn-danger" onclick="indieauthor.removeSection(\'{{id}}\')" data-toggle="tooltip"  title="{{translate "sections.deleteSection"}}"><i class="fa fa-times"></i></button></div></div><div class="section-elements dragula-container" data-type="{{type}}" data-role="container"></div></div></div>';
    var rendered = indieauthor.renderTemplate(sectionTemplate, {
        type: "section-container",
        id: section.id,
        name: section.name
    });

    $(indieauthor.container).append(rendered);

    if (isCommand) {
        indieauthor.undoredo.pushCommand('addSection', section.id, {
            element: section,
            parentType: "section-container",
            view: rendered,
            position: (indieauthor.model.sections.length - 1)
        })
    }
}

indieauthor.removeSection = function (sectionId) {

    indieauthor.undoredo.pushCommand('removeSection', sectionId, {
        element: jQuery.extend({}, indieauthor.model.findObject(sectionId)),
        parentType: "section-container",
        position: indieauthor.utils.findIndexObjectInArray(indieauthor.model.sections, "id", sectionId),
        view: this.findElementByDataId(sectionId).parentNode.outerHTML
    });

    indieauthor.deleteToolTipError(document.getElementById("sec-" + sectionId).querySelector('[data-prev]'));
    indieauthor.model.removeElement(sectionId);
    $(document.getElementById("sec-" + sectionId).parentNode).fadeOut(400, function () {
        $(this).remove();
    });

    indieauthor.utils.notifiySuccess(indieauthor.strings.messages.successMessage, indieauthor.strings.messages.deletedSection);
}

indieauthor.swap = function (sectionOriginId, direction) {
    var positionQuery = (direction == 1) ? $(document.getElementById("sec-" + sectionOriginId).parentNode).prev() : $(document.getElementById("sec-" + sectionOriginId).parentNode).next();

    if (positionQuery.length == 1) {
        var targetOrigin = indieauthor.polyfill.getData(positionQuery[0].firstElementChild, 'id');
        indieauthor.utils.swap(document.getElementById("sec-" + sectionOriginId).parentNode, document.getElementById("sec-" + targetOrigin).parentNode);
        indieauthor.model.swap(sectionOriginId, targetOrigin);
    }

    indieauthor.undoredo.pushCommand('swapSection', {
        sectionOriginId: sectionOriginId,
        direction: direction
    });
}

indieauthor.openSectionSettings = function (id) {
    document.getElementById('modal-settings-body').innerHTML = ''; 
    $("#modal-settings .btn-submit").off('click'); 

    var modelObject = indieauthor.model.findObject(id);
    if (!modelObject) throw new Error('modelObject cannot be null');

    var inputs = '<form id="f-{{id}}"> <div class="form-group"> <label for="name">{{translate "sections.form.name.label"}}</label> <input type="text" name="name" class="form-control" value="{{name}}" placeholder="{{translate "sections.form.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted" >{{translate "sections.form.name.help"}}</small > </div><div class="form-group"> <label for="bookmark">{{translate "sections.form.bookmark.label"}}</label> <input type="text" name="bookmark" class="form-control" value="{{bookmark}}" placeholder="{{translate "sections.form.bookmark.placeholder"}}" maxLength="40" autocomplete="off" required/> <small class="form-text text-muted" >{{translate "sections.form.bookmark.help"}}</small > </div></form>';

    document.getElementById('modal-settings-body').innerHTML = indieauthor.renderTemplate(inputs, {
        id: id,
        name: modelObject.name,
        bookmark: modelObject.bookmark
    });

    document.getElementById('modal-settings-tittle').innerHTML = "Section: " + modelObject.name;

    $("#modal-settings").modal({
        show: true,
        keyboard: false,
        focus: true,
        backdrop: 'static'
    });

    var form = document.getElementById('f-' + id);
    var input = document.createElement('input');
    input.type = 'submit';
    input.classList.add('hide');
    form.appendChild(input);

    $(form).on('submit', function (e) {
        e.preventDefault();
        var formData = indieauthor.utils.toJSON(form);
        var errors = [];

        if (formData.bookmark.length > 40) {
            var errorText = indieauthor.strings.errors.section.invalidBookmark;
            errors.push(errorText);
        }

        if (errors.length > 0) {
            $("#modal-settings").animate({
                scrollTop: 0
            }, "slow");

            var errText = "";

            errors.map(function (text) {
                errText += " " + text;
            });

            if ($("#modal-settings-body .errors").length == 0) {
                $("#modal-settings-body").prepend('<div class="errors">' + indieauthor.generateAlertError(errText) + '</div>');
            } else {
                $("#modal-settings-body .errors").html(indieauthor.generateAlertError(errText));
            }

        } else {
            modelObject.name = formData.name;
            modelObject.bookmark = formData.bookmark;

            $("#modal-settings").modal('hide');
            $("#modal-settings [name='type']").off('change');
            var preview = indieauthor.renderTemplate('<div class="prev-container"><span>{{name}}</span></div>', modelObject);

            document.querySelector("[data-id='" + id + "']").querySelector(".b2").innerHTML = preview;
            $(form).remove();
        }
    });

    $("#modal-settings .btn-submit").on('click', function (e) {
        input.click();
    });
}

indieauthor.createViewElement = function (elementType, widget, viewElement, dataElementId, parentType, parentContainerIndex, parentContainerId, inPositionElementId, modelCreation) {
    viewElement.innerHTML = '';
    $(viewElement).removeClass('palette-item');
    $(viewElement).addClass('container-item');

    var elementToBeAppended;
    var widgetInfo = {
        id: dataElementId
    };

    if (elementType == 'layout') widgetInfo.columns = indieauthor.polyfill.getData(viewElement, 'columns');
    indieauthor.utils.clearDataAttributes(viewElement);

    if (modelCreation) {
        var modelObject = indieauthor.model.createObject(elementType, widget, dataElementId, widgetInfo);

        if (parentType == 'layout')
            indieauthor.model.appendObject(modelObject, inPositionElementId, parentContainerId, parentContainerIndex);
        else
            indieauthor.model.appendObject(modelObject, inPositionElementId, parentContainerId);
    }

    elementToBeAppended = indieauthor.generateHTMLElement(widget, widgetInfo);
    $(viewElement).append(elementToBeAppended);
    indieauthor.generateToolbars(elementType, widget, widgetInfo);
}

indieauthor.generateToolbars = function (type, widget, widgetInfo) {
    var toolbar = $("[data-id='" + widgetInfo.id + "'] [data-toolbar]")[0];
    var buttons = "";

    var toolBarModel = {
        id: widgetInfo.id,
        widget: widget,
        type: type
    };

    if (type == 'specific-container' || type == 'specific-element-container')
        buttons += indieauthor.renderTemplate('<button class="btn btn-sm btn-success" onclick="indieauthor.addContent(\'{{id}}\', \'{{widget}}\', \'{{type}}\')" data-toggle="tooltip"  title="{{translate "items.add"}}"><i class="fa fa-plus-circle"></i></button>', toolBarModel);

    if (indieauthor.widgets[widget].widgetConfig.toolbar.edit)
        buttons += indieauthor.renderTemplate('<button class="btn btn-sm btn-success" onclick="indieauthor.openSettings(\'{{id}}\')" data-toggle="tooltip"  title="{{translate "items.edit"}}"><i class="fa fa-edit"></i></button>', toolBarModel);

    buttons += indieauthor.renderTemplate('<button class="btn btn-sm btn-danger" onclick="indieauthor.removeElement(\'{{id}}\')" data-toggle="tooltip"  title="{{translate "items.delete"}}"><i class="fa fa-times"></i></button>', toolBarModel);

    $(toolbar).append(buttons);
}

indieauthor.openSettings = function (dataElementId) {
    document.getElementById('modal-settings-body').innerHTML = ''; 
    $("#modal-settings .btn-submit").off('click'); 

    var modelObject = indieauthor.model.findObject(dataElementId);
    if (!modelObject) throw new Error('modelObject cannot be null');

    var widgetModal = indieauthor.widgets[modelObject.widget].getInputs(modelObject);

    document.getElementById('modal-settings-body').innerHTML = widgetModal.inputs;
    document.getElementById('modal-settings-tittle').innerHTML = widgetModal.title;
    $("#modal-settings").modal({
        show: true,
        keyboard: false,
        focus: true,
        backdrop: 'static'
    });
    var form = document.getElementById('f-' + dataElementId);
    var input = document.createElement('input');
    input.type = 'submit';
    input.classList.add('hide');
    form.appendChild(input);

    $(form).on('submit', function (e) {
        e.preventDefault();

        var formData = indieauthor.utils.toJSON(form);
        var errors = indieauthor.widgets[modelObject.widget].validateForm(formData, dataElementId);
        if (errors.length > 0) {

            $("#modal-settings").animate({
                scrollTop: 0
            }, "slow");

            var errorText = "";
            $.map(errors, function (item) {
                errorText += jsonpath.query(indieauthor.strings, "$.errors." + item) + ". ";
            });

            if ($("#modal-settings-body .errors").length == 0) {
                $("#modal-settings-body").prepend('<div class="errors">' + indieauthor.generateAlertError(errorText) + '</div>');
            } else {
                $("#modal-settings-body .errors").html(indieauthor.generateAlertError(errorText));
            }

        } else {
            indieauthor.widgets[modelObject.widget].settingsClosed(modelObject);
            $("#modal-settings").modal('hide');
            indieauthor.confirmSettings(modelObject, formData);
            $(form).remove();
        }
    });

    $("#modal-settings .btn-submit").on('click', function () {
        input.click();
    });

    indieauthor.widgets[modelObject.widget].settingsOpened(modelObject);
}

indieauthor.generateAlertError = function (error) {
    var errorTemplate = '<div class="alert alert-danger alert-dismissible fade show" role="alert">{{errortext}}<button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button></div>';

    return indieauthor.renderTemplate(errorTemplate, {
        errortext: error
    });
}

indieauthor.confirmSettings = function (modelObject, formData) {
    $("#modal-settings-body .errors").remove();

    indieauthor.model.updateObject(modelObject, formData);
    indieauthor.widgets[modelObject.widget].preview(modelObject);

    document.getElementById('modal-settings-body').innerHTML = '';
    document.getElementById('modal-settings-tittle').innerHTML = '';

    var previewElement = document.querySelector("[data-id='" + modelObject.id + "']").querySelector('[data-prev]');
    indieauthor.deleteToolTipError(previewElement);
    $(document.querySelector("[data-id='" + modelObject.id + "']").parentNode).removeClass('editor-error', 200);
}

indieauthor.removeElement = function (id) {
    var elementToBeRemoved = indieauthor.model.findObject(id);
    var parent = indieauthor.model.findParentOfObject(id);

    var parentContainerId = parent.id;
    var parentContainerIndex = -1;
    var inPositionElementId = -1;

    if (parent.type == 'layout') {
        for (var i = 0; i < parent.data.length; i++) {
            var elementArray = parent.data[i];
            var objectIndex = indieauthor.utils.findIndexObjectInArray(elementArray, "id", id);
            if (objectIndex != -1) {
                var positionIndex = objectIndex + 1;
                if (positionIndex < elementArray.length) inPositionElementId = elementArray[positionIndex].id;
                parentContainerIndex = i;
            }
        }
    } else {
        var objectIndex = indieauthor.utils.findIndexObjectInArray(parent.data, "id", id);
        var positionIndex = objectIndex + 1;
        if (positionIndex < parent.data.length) inPositionElementId = parent.data[positionIndex].id;
    }

    indieauthor.undoredo.pushCommand('remove', id, {
        element: jQuery.extend({}, elementToBeRemoved),
        parentType: parent.type,
        parentContainerIndex: parentContainerIndex,
        parentContainerId: parentContainerId,
        inPositionElementId: inPositionElementId,
        view: this.findElementByDataId(id).parentNode.outerHTML
    });

    indieauthor.deleteToolTipError(document.querySelector("[data-id='" + id + "']").querySelector('[data-prev]'));
    indieauthor.model.removeElement(id);
    $(document.querySelector("[data-id='" + id + "']")).fadeOut(400, function () {
        $(this.parentNode).remove();
    });
}

indieauthor.addContent = function (containerId, widget, type) {
    if (type != 'specific-container' && type != 'specific-element-container')
        throw new Error('Cannot create content for non-specific container');

    var widgetTypeToCreate;

    if (indieauthor.widgets[widget].widgetConfig.allow.length > 1) {
        var options = [];

        for (var i = 0; i < indieauthor.widgets[widget].widgetConfig.allow.length; i++) {
            var widgetAllowed = indieauthor.widgets[widget].widgetConfig.allow[i];
            options.push({
                text: indieauthor.strings.widgets[widgetAllowed].label,
                value: widgetAllowed
            });
        }

        bootprompt.prompt({
            title: indieauthor.strings.common.selectType,
            inputType: 'select',
            inputOptions: options,
            value: indieauthor.widgets[widget].widgetConfig.allow[0], 
            closeButton: false,
            callback: function (result) {
                if (result) {
                    widgetTypeToCreate = result;
                    indieauthor.addSpecificContent(containerId, widgetTypeToCreate);
                }
            }
        });
    } else {
        widgetTypeToCreate = indieauthor.widgets[widget].widgetConfig.allow[0];
        indieauthor.addSpecificContent(containerId, widgetTypeToCreate);
    }
}

indieauthor.addSpecificContent = function (containerId, widgetTypeToCreate) {
    var elementTypeToCreate = indieauthor.widgets[widgetTypeToCreate].widgetConfig.type;
    var target = document.querySelector('[data-id="' + containerId + '"]');

    var newElement = document.createElement("div");
    target.querySelector('[data-content]').appendChild(newElement);
    var dataElementId = indieauthor.utils.generate_uuid();

    var parentType = indieauthor.polyfill.getData(target, 'type'); 
    var parentContainerIndex = -1; 
    var parentContainerId = indieauthor.polyfill.getData($(target).closest('[data-id]')[0], 'id');
    var inPositionElementId = -1;

    indieauthor.createViewElement(elementTypeToCreate, widgetTypeToCreate, newElement, dataElementId, parentType, parentContainerIndex, parentContainerId, inPositionElementId, true);

    indieauthor.undoredo.pushCommand("add", dataElementId, {
        element: jQuery.extend({}, indieauthor.model.findObject(dataElementId)),
        parentType: parentType,
        parentContainerIndex: parentContainerIndex,
        parentContainerId: parentContainerId,
        inPositionElementId: inPositionElementId,
        view: newElement.outerHTML
    });
}


indieauthor.toggleCategory = function (category) {
    var divCategory = document.querySelector("[data-category-header='" + category + "']");
    var icon = divCategory.querySelector("[data-icon]");
    var isHidden = indieauthor.utils.parseBoolean(indieauthor.polyfill.getData(divCategory, 'hidden'));

    if (isHidden == true) {
        $("[data-category=" + category + "]").show(300);
        indieauthor.polyfill.setData(divCategory, 'hidden', false);
        $(icon).removeClass("fa-caret-down");
        $(icon).addClass("fa-caret-up");
    } else if (isHidden == false) {
        $("[data-category=" + category + "]").hide(300);
        indieauthor.polyfill.setData(divCategory, 'hidden', true);
        $(icon).addClass("fa-caret-down");
        $(icon).removeClass("fa-caret-up");
    }
}

indieauthor.generateHTMLElement = function (widgetType, widgetInfo) {
    return indieauthor.widgets[widgetType].createElement(widgetInfo);
}

indieauthor.loadWidgets = function (palette) {
    try {
        for (var i = 0; i < widgetsJson.length; i++) {
            var widgetCategory = widgetsJson[i];
            var widgetList = [];
            var numWidgets = 0;

            var categoryWidgets = widgetCategory.widgets;
            for (var j = 0; j < categoryWidgets.length; j++) {
                var widget = categoryWidgets[j];
                if (!indieauthor.widgets[widget.widget].paleteHidden) {
                    var widgetView = indieauthor.createWidgetView(widget.widget);
                    widgetList.push(widgetView.content);
                    numWidgets += widgetView.numItems;
                }
            }

            var categoryView = indieauthor.createCategoryView(widgetCategory.category, numWidgets);

            $(palette).append(categoryView);
            $(palette).append(widgetList);

        }
    } catch (err) {
        console.error(err);
    }
}

indieauthor.createCategoryView = function (category, numWidgets) {
    var categoryTemplate = '<div class="dragula-anchor palette-section-header align-self-center" data-category-header="{{category}}" data-hidden="false"><div class="row wrap"><div class="col-9 first-block"><span class="header-label">{{translate title}} <i>({{numWidgets}} items)</i></span></div><div class="col-3 second-block vcenter"><button onclick=\'indieauthor.toggleCategory("{{category}}")\' class="float-right btn btn-outline btn-indie btn-sm btn-no-border" data-toggle="tooltip"  title="{{translate "buttons.toggleCategories"}}"><i data-icon class="fa fa-caret-up"></i></button></div></div></div>';

    var rendered = indieauthor.renderTemplate(categoryTemplate, {
        title: "palette." + category,
        category: category,
        numWidgets: numWidgets
    });

    return rendered;
}

indieauthor.createWidgetView = function (widget) {
    return indieauthor.widgets[widget].createPaletteItem();
}

indieauthor.loadElement = function (target, element, isSection, modelCreation = false) {

    if (isSection) {
        indieauthor.addSection(element.id, false);
        var preview = indieauthor.renderTemplate('<div class="prev-container"><span>{{name}}</span></div>', element);

        document.querySelector("[data-id='" + element.id + "']").querySelector(".b2").innerHTML = preview;
    } else {
        var el = document.createElement("div");
        $(target).append(el);

        if (element.type == 'layout') indieauthor.polyfill.setData(el, 'columns', element.data.length);

        var parentType = indieauthor.polyfill.getData(target, 'type'); 
        var parentContainerIndex = -1; 
        var parentContainerId = indieauthor.polyfill.getData($(target).closest('[data-id]')[0], 'id');

        if (parentType == 'layout') {
            parentContainerIndex = indieauthor.polyfill.getData(target, 'index');
        }

        var inPositionElementId = -1;

        indieauthor.createViewElement(element.type, element.widget, el, element.id, parentType, parentContainerIndex, parentContainerId, inPositionElementId, modelCreation);
        indieauthor.widgets[element.widget].preview(element);
    }

    if (indieauthor.hasChildren(element.type)) {
        if (element.type == 'layout') {
            for (var i = 0; i < element.data.length; i++) {
                var arrayOfElements = element.data[i];
                var subContainerTarget = document.querySelector('[data-id="' + element.id + '"]').querySelector('[data-index="' + i + '"');
                for (var j = 0; j < arrayOfElements.length; j++) {
                    indieauthor.loadElement(subContainerTarget, arrayOfElements[j]);
                }
            }
        } else {
            var subContainerTarget = (element.type == 'specific-container' || element.type == 'simple-container' || element.type == 'specific-element-container') ? document.querySelector('[data-id="' + element.id + '"]').querySelector('[data-content]') : document.querySelector('[data-id="' + element.id + '"]').querySelector('[data-role="container"]');
            for (var i = 0; i < element.data.length; i++) {
                var subElement = element.data[i];
                indieauthor.loadElement(subContainerTarget, subElement);
            }
        }
    }
}

indieauthor.hasChildren = function (elementType) {
    return (elementType == 'specific-container' || elementType == 'simple-container' || elementType == 'specific-element-container' || elementType == 'element-container' || elementType == 'layout' || elementType == 'section-container');
}

indieauthor.renderTemplate = function (template, model) {
    var templateInstance = Handlebars.compile(template);
    var html = templateInstance(model);
    return html;
}


indieauthor.showErrors = function (currentErrors, newErrors) {
    for (var i = 0; i < currentErrors.length; i++) {
        var currentError = currentErrors[i];

        var element = document.querySelector("[data-id='" + currentError.element + "']");
        if (!element) continue;

        var previewElement = element.querySelector('[data-prev]');
        indieauthor.deleteToolTipError(previewElement);

        if (!indieauthor.utils.findObjectInArray(newErrors, 'element', currentError.element)) {
            $(element.parentNode).removeClass('editor-error', 200);
        }
    }

    for (var i = 0; i < newErrors.length; i++) {
        var error = newErrors[i];
        var element = document.querySelector("[data-id='" + error.element + "']");
        var previewElement = element.querySelector('[data-prev]');

        if (!$(element.parentNode).hasClass('editor-error')) $(element.parentNode).addClass('editor-error', 200);

        indieauthor.creatToolTipError(error, previewElement);
    }
}


indieauthor.creatToolTipError = function (error, previewElement) {
    var errorText = $.map(error.keys, function (item) {
        return jsonpath.query(indieauthor.strings, "$.errors." + item);
    });

    indieauthor.polyfill.setData(previewElement, 'title', errorText.join(" "));
    indieauthor.polyfill.setData(previewElement, 'original-title', errorText.join(" "));
    previewElement.addEventListener('mouseenter', $(previewElement).tooltip('show'));
    previewElement.addEventListener('mouseleave', $(previewElement).tooltip('hide'));
}

indieauthor.deleteToolTipError = function (previewElement) {
    indieauthor.polyfill.deleteData(previewElement, 'title');
    indieauthor.polyfill.deleteData(previewElement, 'original-title');
    previewElement.removeEventListener('mouseenter', $(previewElement).tooltip('show'));
    previewElement.removeEventListener('mouseout', $(previewElement).tooltip('hide'));
    $(previewElement).tooltip('dispose');
}

indieauthor.findElementByDataId = function (dataId) {
    return document.querySelector("[data-id='" + dataId + "']");
}
indieauthor.plugins.preparePlugins = function () {
    Handlebars.registerHelper('ifeq', function (a, b, options) {
        if (a == b) {
            return options.fn(this);
        }
    });
    Handlebars.registerHelper('ifneq', function (a, b, options) {
        if (a != b) {
            return options.fn(this);
        }
    });
    Handlebars.registerHelper("inc", function (value, options) {
        return parseInt(value) + 1;
    });

    Handlebars.registerHelper('translate', function (jsonPathQuery) {
        var translation = jsonpath.query(indieauthor.strings, "$." + jsonPathQuery);
        return new Handlebars.SafeString(translation);
    });
}

indieauthor.plugins.dependencies = function (container) {
    $("body").tooltip({
        trigger: 'hover',
        selector: "[data-toggle='tooltip']",
    });

    $(document).on('click', "#" + container.id + " .btn", function () {
        $("[data-toggle='tooltip']").tooltip('hide');
    })
}
indieauthor.model.sections = []; 

indieauthor.model.currentErrors = [];

indieauthor.model.CURRENT_MODEL_VERSION = 9;

indieauthor.model.VERSION_HISTORY = [1, 2, 3, 4, 5, 6, 7, 8, 9];

indieauthor.model.createSection = function () {
    var sectionData = {
        id: indieauthor.utils.generate_uuid(),
        name: indieauthor.strings.sections.label + " " + (indieauthor.model.sections.length + 1),
        type: "section-container",
        widget: "Section",
        bookmark: "",
        data: []
    };

    indieauthor.model.sections.push(sectionData);
    return sectionData;
}

indieauthor.model.createObject = function (elementType, widget, dataElementId, widgetInfo) {
    var modelObject = {
        id: dataElementId,
        type: elementType,
        widget: widget
    }

    var widgetData = indieauthor.widgets[widget].emptyData(widgetInfo);

    if (widgetData.params) modelObject.params = widgetData.params;
    if (widgetData.data) modelObject.data = widgetData.data;

    return modelObject;
}

indieauthor.model.appendObject = function (modelObject, inPositionElementId, parentContainerId, parentContainerIndex) {
    var parent = indieauthor.model.findObject(parentContainerId);
    if (parent.type == 'layout')
        indieauthor.model.pushOrAppendObject(parent.data[parentContainerIndex], modelObject, inPositionElementId);
    else
        indieauthor.model.pushOrAppendObject(parent.data, modelObject, inPositionElementId);
}

indieauthor.model.pushOrAppendObject = function (array, modelObject, inPositionElementId) {
    if (inPositionElementId == -1)
        array.push(modelObject);
    else {
        var inPositionIndex = indieauthor.utils.findIndexObjectInArray(array, 'id', inPositionElementId);
        array.splice(inPositionIndex, 0, modelObject);
    }
}

indieauthor.model.updateObject = function (modelObject, formData) {
    indieauthor.widgets[modelObject.widget].updateModelFromForm(modelObject, formData);
}

indieauthor.model.removeElement = function (dataElementId) {
    var elementsArray = indieauthor.model.sections;
    indieauthor.model.removeElementInModel(elementsArray, dataElementId);
}

indieauthor.model.removeElementInModel = function (elementsArray, dataElementId) {
    for (var i = 0; i < elementsArray.length; i++) {
        var element = elementsArray[i];

        if (element.id == dataElementId) {
            elementsArray.splice(i, 1);
            return true;
        } else {
            if (element.type == 'layout') {
                for (var j = 0; j < element.data.length; j++) {
                    var elementsSubArray = element.data[j];
                    if (indieauthor.model.removeElementInModel(elementsSubArray, dataElementId)) return true;
                }
            } else if (element.type == 'specific-container' || element.type == 'simple-container' || element.type == 'specific-element-container' || element.type == 'element-container' || element.type == 'section-container') {
                if (indieauthor.model.removeElementInModel(element.data, dataElementId)) return true;
            }
        }
    }

    return false;
}

indieauthor.model.findObject = function (dataElementId) {
    var elementsArray = indieauthor.model.sections;
    var elementSearch;

    for (var i = 0; i < elementsArray.length; i++) {
        var element = elementsArray[i];
        elementSearch = indieauthor.model.findElementOrSubelementInModel(element, dataElementId);

        if (elementSearch)
            break;
    }

    return elementSearch;
}

indieauthor.model.findElementOrSubelementInModel = function (element, dataElementId) {
    if (element.id == dataElementId) {
        return element;
    } else if (indieauthor.hasChildren(element.type)) {
        var elementsArray = element.type == 'layout' ? [].concat.apply([], element.data) : element.data;
        var result;
        for (var i = 0; result == undefined && i < elementsArray.length; i++) {
            result = indieauthor.model.findElementOrSubelementInModel(elementsArray[i], dataElementId);
        }

        return result;
    }

    return undefined;
}

indieauthor.model.findParentOfObject = function (dataElementId) {

    var findParent = function (parent, elementArray, elementId) {
        for (var i = 0; i < elementArray.length; i++) {
            var element = elementArray[i];

            if (element.id == elementId) {
                return parent;
            } else if (indieauthor.hasChildren(element.type)) {
                if (element.type == 'layout') {
                    var elementsArray = [].concat.apply([], element.data);
                    for (var j = 0; j < elementsArray.length; j++) {
                        var subElement = elementsArray[j];
                        if (subElement.id == elementId)
                            return element;
                    }
                } else {
                    var subParent = findParent(element, element.data, elementId);
                    if (subParent != undefined)
                        return subParent;
                }
            }
        }

        return undefined;
    }

    for (var i = 0; i < indieauthor.model.sections.length; i++) {
        var section = indieauthor.model.sections[i];

        var parent = findParent(section, section.data, dataElementId);
        if (parent != undefined)
            return parent;

    }

    return undefined;
}


indieauthor.model.moveElementWithinContainer = function (elementId, newPosition, containerId, containerIndex) {
    var container = indieauthor.model.findObject(containerId);
    var elementsArray = containerIndex ? container.data[containerIndex] : container.data;
    var currentPosition = indieauthor.utils.findIndexObjectInArray(elementsArray, 'id', elementId);
    indieauthor.utils.array_move(elementsArray, currentPosition, newPosition);
}


indieauthor.model.moveElementFromContainerToAnother = function (elementId, inPositionElementId, targetContainerId, targetContainerIndex) {
    var originalObject = indieauthor.model.findObject(elementId);
    var copyOfObject = jQuery.extend({}, originalObject)
    indieauthor.model.removeElement(originalObject.id);
    indieauthor.model.appendObject(copyOfObject, inPositionElementId, targetContainerId, targetContainerIndex);
}

indieauthor.model.swap = function (originId, targetId) {
    var secArray = indieauthor.model.sections;
    var old_index = indieauthor.utils.findIndexObjectInArray(secArray, 'id', originId);
    var new_index = indieauthor.utils.findIndexObjectInArray(secArray, 'id', targetId);
    indieauthor.utils.array_move(secArray, old_index, new_index);
}

indieauthor.model.validate = function () {
    var errors = [];

    for (var i = 0; i < indieauthor.model.sections.length; i++) {
        var section = indieauthor.model.sections[i];
        var sectionKeys = [];

        if (section.data.length == 0)
            sectionKeys.push("section.emptyData");

        if (!section.name || (section.name.length <= 0))
            sectionKeys.push("section.invalidName");

        if (section.bookmark.length == 0 || section.bookmark.length > 40)
            sectionKeys.push("section.invalidBookmark");

        if (sectionKeys.length > 0) {
            errors.push({
                element: section.id,
                keys: sectionKeys
            });
        }

        for (var j = 0; j < section.data.length; j++) {
            indieauthor.model.validateElement(section.data[j], errors);
        }
    }

    indieauthor.model.currentErrors = errors;
    return errors;
}

indieauthor.model.validateElement = function (element, errors) {
    var currentElementValidation = indieauthor.widgets[element.widget].validateModel(element);
    if (currentElementValidation) errors.push(currentElementValidation);

    if (indieauthor.hasChildren(element.type)) {
        var elementsArray = element.type == 'layout' ? [].concat.apply([], element.data) : element.data;
        for (var i = 0; i < elementsArray.length; i++) {
            var element = elementsArray[i];
            indieauthor.model.validateElement(element, errors)
        }
    }
}

indieauthor.model.isUniqueName = function (name, currentElementId) {
    var sections = indieauthor.model.sections;

    var recursiveIsUnique = function (element, name, currentElementId) {

        if (element.params && (element.params.name && (element.params.name == name && element.id != currentElementId))) {
            return false;
        } else if (element.type != 'element' || element.type != 'specific-element') {
            var elementsArray = element.type == 'layout' ? [].concat.apply([], element.data) : element.data;
            var keepsUnique = true;
            for (var i = 0; keepsUnique && i < elementsArray.length; i++) {
                keepsUnique = recursiveIsUnique(elementsArray[i], name, currentElementId);
            }

            return keepsUnique;
        }

        return true;
    }

    var isUnique = true;

    for (var i = 0; i < sections.length && isUnique; i++) {
        isUnique = recursiveIsUnique(sections[i], name, currentElementId);
    }

    return isUnique;
}
indieauthor.widgetFunctions = {};

indieauthor.widgetFunctions.initTextEditor = function (content, element) {
    $(element).trumbowyg({
        btns: [
            ['undo', 'redo'], 
            ["Format"],
            ['strong', 'em', 'del'],
            ['link'],
            ['unorderedList', 'orderedList'],
            ['removeformat'],
            ['whitespace'],
            ['table', 'template'],
            ['fullscreen']
        ],
        btnsDef: {
            Format: {
                dropdown: ['p', 'h1', 'h2', 'h3', 'h4'],
                ico: 'p'
            }
        },
        minimalLinks: true,
        removeformatPasted: true,
        tagsToRemove: ['script', 'link', 'style', 'img', 'applet', 'embed', 'noframes', 'iframe', 'noscript'],
        plugins: {
            table: {
                styler: "table"
            },
            templates: [
                {
                    name: indieauthor.strings.plugins.trumbowyg.templates.code,
                    html: "\\begin[language]{}Code\\end"
                },
                {
                    name: indieauthor.strings.plugins.trumbowyg.templates.screenReader,
                    html: "\\begin[hidden]{}Help text\\end"
                }
            ]
        }
    });

    if (content) $(element).trumbowyg('html', content);
}

indieauthor.widgetFunctions.clearAndSanitizeHtml = function (html) {
    var temporaryDivElement = document.createElement('div');
    temporaryDivElement.hidden = true;
    temporaryDivElement.innerHTML = html;

    for (let elem of temporaryDivElement.querySelectorAll("*")) {
        elem.removeAttribute('style');

        if (elem.innerHTML.trim().length == 0 && elem.tagName !== 'br') {
            elem.remove();
        }
    }

    var finalHtml = temporaryDivElement.innerHTML;

    temporaryDivElement.remove();
    return finalHtml;
}

indieauthor.widgetFunctions.isEmptyText = function (text) {
    var emptyTextRegex = /^(<br>$)/;
    return emptyTextRegex.test(text);
}

indieauthor.widgetFunctions.showFormula = function (formula, domElement) {
    katex.render(formula, domElement, {
        throwOnError: false
    });
}
indieauthor.widgets.AcordionContainer = {
    widgetConfig: {
        widget: "AcordionContainer",
        type: "specific-container",
        label: "Acordion",
        allow: ["AcordionContent"],
        category: "containers",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.AcordionContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function () {
        return '<div class="widget-base widget-acordeon-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.AcordionContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="nested-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"> <div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AcordionContainer.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.AcordionContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("AcordionContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAC6klEQVRoBe2ZX2hSURzHv2rrjzp1sIpFXEcxIvtDDOL2ZzT3srX20ILt0kMroiFUL0qRWg8VPSi9rF72YEX1EJVF9dACIZi2l2wwerJYL+ZrwWZpL23e+Jkuo6v3er16bfiBC8q9556Ph3N+5/j7aVAAw3K7AAxCXeIAXiSiwfliFkvSDMuNAXBubFsLutTi7UwMOfEjiWjwfVENhuWuMCzHhyLveLVJfk/xB0cu8AzLzTEsZyklPXfn0YTqwnlIfN/gWRJ3CvlqGZazA7AMDXSrPJX/YDIa0Nu9m74fFrqvzX+gB+sJcwkfbV2ZSqQhrTSrVjZZPL6A3eML/BVFVkjph098BRJfFJfSdG0ted9iMtJmNwlg3uMLuPxexz1IkV44HUDmwZSCqgWY9Wh6dRGaHVaxJ2mk73p8gbjf6wiLSpOwzn8MujN9ygonf+Dn/kvIvJyBTlw6zwkAYUlzWruTqVTxX8x6aKxlHxfa8b9GD0kLcdH3HJquj8r2nEwjM/UBOpHFKIQkaXo56KoTGptLrWhI14qGdK0QDXnuDQt4ZslURce0CDxcncH2MtuJSpOwa3QYezpt8u2KcO7aOF4388pLEyRcDWm5qYrlOadNzQaM3X6CvZ3bFO04mUoj9ukz+n7/6y4LUWlbhzWb9cllfhTH1tGuvDTJ3rp+Hr0Hyh8RMfqPu7PvL3e9SJrT1cqJmIx6We2W50KksETxtBqZVJoawwP2stuJSj8ev4ynExG5XiUhYTk5REkj7RwdUtq3IhqnvFrRkK4V2lxRpmrbtFxCb6Zh0K8RbK1NRIMkHb564z6+pdJ1IUwhNjYbxyamTfB+PuS5YrPxyf4Rt+XU0UOyDjFKQIMWikxnpbdsZrCutUXwrYV1REqnUi3Rnk/0qcH61pascJEdOOz3OnqWNpdchfSk0JMeX4BX60cIITV6FK+c1pash1RpVx0I00y4CanSVDKgWnU+PKoA9d/j9zrU6r9CAPwCoOzP8QlLHz4AAAAASUVORK5CYII="
}
indieauthor.widgets.AcordionContent = {
    widgetConfig: {
        widget: "AcordionContent",
        type: "element-container",
        label: "Acordion content",
        allow: ["element", "layout", "specific-element-container"],
        category: "containers",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function () {
        return '<div class="widget-acordion-content" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"> <div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.AcordionContent.label"}}</span></div><div class="b3" data-toolbar></div></div><div data-role="container" data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container"></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id
        }

        if (!indieauthor.utils.isEmpty(modelObject.params))
            templateValues.title = modelObject.params.title;

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="title">{{translate "widgets.AcordionContent.form.title.label"}}</label><input type="text" class="form-control" name="title" required placeholder="{{translate "widgets.AcordionContent.form.title.placeholder"}}" value="{{title}}" autocomplete="off"/><small class="form-text text-muted">{{translate "widgets.AcordionContent.form.title.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AcordionContent.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.title)
            element.innerHTML = indieauthor.strings.widgets.AcordionContent.label + ": " + modelObject.params.title;
        else
            element.innerHTML = indieauthor.strings.widgets.AcordionContent.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                title: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.title = formJson.title;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.params.title.length == 0) errors.push("AcordionContent.title.invalid");
        if (widgetInstance.data.length == 0) errors.push("AcordionContent.data.empty");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            };

        return undefined;
    },
    validateForm: function (formData) {
        if (formData.title.length == 0)
            return ["AcordionContent.title.invalid"]

        return [];
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACOklEQVRoBWNkQAJy5mEGDAwMAQwDCx4wMDBseHRy1QdcroA7Ws48rJ+BgaFARlKUAYQHCpw4d40B6vDARydXXcDpDDnzsAY587D/Ow+e+j/Q4OPnL/89Ysv+y5mHvZczDxPA5+j3c1dsHXAHwwDI4VYB2SCHF2BzL5OceZgDAwODQIi3/QAnZQTg4+FmcLM3BfH9sckzwRgghYMJ8ONxD9OgcimRYNTR1AbsbKwCFe2zHCraZ6GUIoPa0QJ8PKDKbj8DA8P9ivZZCTDxoZI8QCE9HxTqDEMwTcczDEFHK4AIFkKq/l9+yPBvyznaOIGfi4E5y51kbQQd/durjYGRn4uBUZ76jah/h6+DaVIdTtDRDB+/MbAsL2BgtNEk23G4wB/vNrD5pILhW7n8/0B6aNDSXMLJAxSNURPIMpwo4GNMspbRtge9wKij6QVGHU0vMOpoeoHh6WhGXXmaOoBRV45kPQSrcdajLeS6h2ZgNE3TC4w6ml5g1NH0AqOOphdggk7KwCZoBg3Yeeg0AzcXJ/aQfnRyFcjRBxonLGT49OXroHDzmq0HGa7desCgJCeJVR5WjRdeu/Vgv2dsuUByhBeDlqoCXR0JA6BA23nwNNjR6spyDGIigljVIc8jgoZTQXOJDrCBvoEA4iKCYAfjmMs80FGZ5ghvMEFnSBOxqaxon/V/oDyBDRBbeuCeOaUvALuDWEcXDgIHg1LCRAZiHd1RmXYANFcNKx4HAIDsd+yoTBso+ykEDAwMANU8kbtxWoUnAAAAAElFTkSuQmCC"
}
indieauthor.widgets.Animation = {
    widgetConfig: {
        widget: "Animation",
        type: "element",
        label: "Animation",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var itemTemplate = '<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.Animation.label"}}</span></div>';
        var item = {};
        item.content = indieauthor.renderTemplate(itemTemplate, this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function () {
        return '<div class="widget widget-animation" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate "widgets.Animation.prev"}}</span></div><div class="b3" data-toolbar></div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            image: modelValues.data.image,
            pieces: modelValues.data.pieces,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        };

        var template = `
            <form id="f-{{instanceId}}">
                <div class="form-group">
                    <label for="instanceName">{{translate "common.name.label"}}</label>
                    <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> 
                    <small class="form-text text-muted">{{translate "common.name.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="help">{{translate "common.help.label"}}</label>
                    <div class="input-group mb-3"> 
                        <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}">
                        <div class="input-group-append">
                            <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> 
                        </div>
                    </div>
                    <small class="form-text text-muted">{{translate "common.help.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="image">{{translate "widgets.Animation.form.image.label"}}</label>
                    <input type="url" class="form-control" name="image" required autocomplete="off" placeholder="{{translate "widgets.Animation.form.image.placeholder"}}" value="{{image}}"/>
                    <small class="form-text text-muted">{{translate "widgets.Animation.form.image.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="alt">{{translate "common.alt.label"}}</label>
                    <input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/>
                    <small class="form-text text-muted">{{translate "common.alt.help"}}</small>
                </div>
                <div class="pieces-wrapper d-none">
                    <div class="form-group"> 
                        <p>{{translate "widgets.Animation.form.image.preview"}}</p>
                        <canvas class="img-preview img-fluid"></canvas>
                    </div>
                    <div class="form-group"> 
                        <button class="btn btn-block btn-indie btn-add-piece" type="button">{{translate "widgets.Animation.form.pieces.new"}}</button> 
                    </div>
                    <div class="pieces"></div>
                </div>
            </form>
            `;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Animation.label
        }
    },
    formPieceTemplate: function (values) {
        let template = `
        <div class="form-row piece">
            <div class="form-group col-12 col-md-4">
                <label for="piece[{{pos}}][altImg]">{{translate "widgets.Animation.form.pieces.altImg"}}</label>
                <input type="text" class="form-control" id="piece[{{pos}}][altImg]" name="piece[{{pos}}][altImg]" value="{{altImg}}" step="any" required />
            </div>
            <div class="form-group col-12 col-md-4">
                <label for="piece[{{pos}}][altRec]">{{translate "widgets.Animation.form.pieces.altRec"}}</label>
                <input type="text" class="form-control" id="piece[{{pos}}][altRec]" name="piece[{{pos}}][altRec]" value="{{altRec}}" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][x]">{{translate "widgets.Animation.form.pieces.x"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][x]" name="piece[{{pos}}][x]" value="{{x}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][y]">{{translate "widgets.Animation.form.pieces.y"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][y]" name="piece[{{pos}}][y]" value="{{y}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][w]">{{translate "widgets.Animation.form.pieces.w"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][w]" name="piece[{{pos}}][w]" value="{{w}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][h]">{{translate "widgets.Animation.form.pieces.h"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][h]" name="piece[{{pos}}][h]" value="{{h}}" min="0" step="any" required />
            </div>
            <div class="form-group col-12 col-md-auto">
                <label for="delete-piece-{{pos}}">{{translate "widgets.Animation.form.pieces.delete"}} &nbsp;</label>
                <button class="btn btn-block btn-danger btn-delete" id="delete-piece-{{pos}}"><i class="fa fa-times"></i></button>
            </div>
        </div>`
        return indieauthor.renderTemplate(template, values)
    },

    settingsClosed: function (modelObject) {
        $(`#f-${modelObject.id}`).trigger('destroyCanvas.animation');
        $(`#f-${modelObject.id}`).off('animation');
        $(window).off('animation');
    },
    settingsOpened: function (modelObject) {

                let $form = $('#f-' + modelObject.id);
        let $piecesContainer = $form.find('.pieces');
        let rects = $.extend(true, [], modelObject.data.pieces);
        for (let chr of ['x', 'y', 'w', 'h'])
            rects.forEach(rect => rect[chr] = parseFloat(rect[chr]))
        let canvas = $form.find('.img-preview').first().get(0);
        let onActionRect = function (e, position) {
            let rect = rects[position];
            let $group = $form.find('.piece').eq(position);
            let $inputs = $group.find('input');
            $inputs.eq(2).val(rect.x);
            $inputs.eq(3).val(rect.y);
            $inputs.eq(4).val(rect.w);
            $inputs.eq(5).val(rect.h);
        }

        let canvasHandler = indieauthor.widgets.Animation.canvas.handler.apply(canvas, [this]);
        rects.forEach((rect, idx) => $piecesContainer.append(indieauthor.widgets.Animation.formPieceTemplate({ ...rect, pos: idx })));

        $(window).on('resize.animation', function () {
            canvasHandler.refreshPieces(rects); 
        });

        $form.on('destroyCanvas.animation', function () { canvasHandler.destroy(); })
        $form.on('actionRect.animation', 'canvas', onActionRect); 
        $form.on('click.animation', '.btn-delete', function (e) {
            let $piece = $(this).closest('.piece');
            let position = $form.find('.piece').index($piece);
            rects.splice(position, 1);
            canvasHandler.refreshPieces(rects);
            $(this).closest('.piece').remove();
            $form.find('.piece input').each(function () {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let $label = $(this).parent().find('label');
                $(this).attr('name', $(this).attr('name').replace(/\[\d+\]/, "[" + position + "]"));
                $(this).attr('id', $(this).attr('id').replace(/\[\d+\]/, "[" + position + "]"));
                $label.attr('for', $label.attr('for').replace(/\[\d+\]/, "[" + position + "]"))
            })
            $form.find('.piece .btn-delete').each(function () {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let $label = $(this).parent().find('label');
                $(this).attr('id', $(this).attr('id').replace(/\-\d+/, "-" + position));
                $label.attr('for', $label.attr('for').replace(/\-\d+/, "-" + position))
            });
        });
        $form.on('click.animation', '.btn-add-piece', function (e) {
            e.preventDefault();
            e.stopPropagation();
            let idx = rects.length;
            let rect = { x: 10, y: 10, w: 100, h: 100 };
            rects.push(rect)
            $form.find('.pieces').append(indieauthor.widgets.Animation.formPieceTemplate({...rect, pos: idx }));
            canvasHandler.refreshPieces(rects);
        });
        $form.on('change.animation', 'input[name="image"]', function (e) {
            let tmpImage = new Image;
            tmpImage.onload = function () {
                $form.find('.pieces-wrapper').removeClass('d-none');
                let img = this;
                setTimeout(function () { canvasHandler.init(img, rects); }, 150);

                            }
            $form.find('.pieces-wrapper').addClass('d-none');
            if (indieauthor.utils.isIndieResource(e.target.value))
                tmpImage.src = e.target.value;

        });

        $form.on('change.animation', 'input[name^="piece"]', function (e) {
            let name = $(this).attr('name');
            let matched = name.match(/\[([A-Za-z])\]$/);
            if (matched) {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let rect = rects[position];
                let value = $(this).val();
                rect[matched[1]] = parseFloat(value);
                canvasHandler.refreshPieces(rects);
            }
        });

        modelObject.data.image && $form.find('input[name="image"]').trigger('change.animation');
    },
    preview: function (modelObject) {
        let element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.Animation.label;
    },
    emptyData: function () {
        return {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
            },
            data: {
                image: "",
                alt: "",
                pieces: []
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
        modelObject.data.image = formJson.image;
        modelObject.data.alt = formJson.alt;
        modelObject.data.pieces = formJson.piece;

            },
    validateModel: function (widgetInstance) {
        let errors = [];
        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

                if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
             errors.push("common.alt.invalid")

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            errors.push("Animation.image.invalid");

                if (widgetInstance.data.pieces.length == 0)
            errors.push("Animation.piece.empty");

                if (widgetInstance.data.pieces.length > 1) {
            widgetInstance.data.pieces.forEach(piece => {
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altImg) && errors.push("Animation.piece.altImg.invalid");
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altRec) && errors.push("Animation.piece.altRec.invalid");
                isNaN(parseFloat(piece['x'])) && errors.push("Animation.piece.x.invalid");
                isNaN(parseFloat(piece['y'])) && errors.push("Animation.piece.y.invalid");
                isNaN(parseFloat(piece['w'])) && errors.push("Animation.piece.w.invalid");
                isNaN(parseFloat(piece['h'])) && errors.push("Animation.piece.h.invalid");
            })
        }      

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

    },
    validateForm: function (formData, instanceId) {
        let errors = [];
        indieauthor.utils.isStringEmptyOrWhitespace(formData.alt) && errors.push("common.alt.invalid");
        !indieauthor.utils.isIndieResource(formData.image) && errors.push("Animation.image.invalid");
        formData.instanceName.length == 0 && errors.push("common.name.invalid");
        !indieauthor.model.isUniqueName(formData.instanceName, instanceId) && errors.push("common.name.notUniqueName");
        (!formData['piece'] || !Array.isArray(formData['piece']) || formData['piece'].length == 0) && errors.push("Animation.piece.empty");
        if (formData['piece'] && Array.isArray(formData['piece'])) {
            formData['piece'].forEach(piece => {
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altImg) && errors.push("Animation.piece.altImg.invalid");
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altRec) && errors.push("Animation.piece.altRec.invalid");
                isNaN(parseFloat(piece['x'])) && errors.push("Animation.piece.x.invalid");
                isNaN(parseFloat(piece['y'])) && errors.push("Animation.piece.y.invalid");
                isNaN(parseFloat(piece['w'])) && errors.push("Animation.piece.w.invalid");
                isNaN(parseFloat(piece['h'])) && errors.push("Animation.piece.h.invalid");
            });
        }
        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAz1BMVEUAAAB4h5oeN1YeN1Z4h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///94h5oeN1a7w8xhc4n5DVxWaIDu8PLHzdXV2d/x8vT3+Pnh5OjM0dn7+/zl6Oz+4evQ1dy/x8+Om6oqQl/a3uT9wtaqtL/8hq1ygpVHXHXz9Pbq7O/9pMKcp7X7Z5n6SYT6KnA5T2v4ts38dqNPY3snP13/8PXKwc38lbeAjqCebo/7WI7tPHr5G2bsD1zRFVt+JVmaH1lHL1e+6C3CAAAAEXRSTlMAQECAMPfg0GAQuqagl4BwMDhYLxIAAAF3SURBVEjHzdTZcoIwFIDhiFvtDokISUBEEMR9q93393+mhohgK5C0V/0vYJj55nAROCBOKe8aZFXrUFD9ZG/P/BlRS7MeYKIViFRhXr3FcXWkiiNQ2eFO+jbkFuojPHYnEjgvOpbGjouQ6XTLcNeyLQbooI94fUxT3G5cZtgwLMwFttFBeLzHmnaeYlSUnWKtxrE4jiv/DpOOj+Qne22LXe+nQpw11J9u2Q0TGTzV9eV6toJ+hEsxjiJTDXTWB4wbhfmYmuZsFIPVox739sn5KiQ52INpOu/1HfL88BgTM01Per7jj7j0UJZ7/bIWn+CCuV4QDDeL5UYGz6W/jSEbLI/ZYCEeIJwcYU+MjWRtBPNffM+9eDClApw1cRGynRLM14bzbW0MaD42DAdz8GNt0BxsoKJwzmRiFPXnv1ty8ydYgaYYe9uIY3Dqh0Qw14M32g6DCyhqyy3HoKWwrtrFccpxUk0TlmHQFNkGyKo1BbYGDquUxsAXPhWNRXY4UVUAAAAASUVORK5CYII=",
    canvas: {
        handler: function () {
            const CORNER_RESIZE_RADIUS = 15;
            const LINE_RESIZE_MARGIN = 10;
            let currentAction;
            let currentIndex;
            let isMouseDown = false;
            let canvas = this;
            let ctx = canvas.getContext('2d');
            let img;
            let paths;
            let rects; 

            let getInteractiveAreas = function () {
                let result = {'move': [], 'e-resize': [], 'w-resize': [], 'n-resize': [], 's-resize': [],
                    'nw-resize': [], 'nwse-resize': [], 'ne-resize': [], 'nesw-resize': [] }
                let ratio = $(canvas).width() / img.width;
                for (let i = 0; i < rects.length; i++) {
                    let rect = rects[i];
                    let x = rect.x * ratio;
                    let y = rect.y * ratio;
                    let w = rect.w * ratio;
                    let h = rect.h * ratio;
                    let pathRect = new Path2D();
                    pathRect.rect(x, y, w, h);
                    result['move'].push(pathRect);
                    let pathLine = new Path2D();
                    pathLine.rect(x - LINE_RESIZE_MARGIN, y + CORNER_RESIZE_RADIUS, 2 * LINE_RESIZE_MARGIN, h - CORNER_RESIZE_RADIUS);
                    result['w-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + w - LINE_RESIZE_MARGIN, y + CORNER_RESIZE_RADIUS, LINE_RESIZE_MARGIN * 2, h - CORNER_RESIZE_RADIUS);
                    result['e-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + CORNER_RESIZE_RADIUS, y - LINE_RESIZE_MARGIN, w - CORNER_RESIZE_RADIUS,  2 * LINE_RESIZE_MARGIN);
                    result['n-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + CORNER_RESIZE_RADIUS, y + h - LINE_RESIZE_MARGIN, w - CORNER_RESIZE_RADIUS,  2 * LINE_RESIZE_MARGIN);
                    result['s-resize'].push(pathLine);
                    let pathCircles = new Path2D();
                    pathCircles.arc(x, y, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nw-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x + w, y + h, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nwse-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x + w, y, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['ne-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x, y + h, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nesw-resize'].push(pathCircles);
                }
                return result;
            }

            let draw = function () {
                let ratio = $(canvas).width() / img.width;
                let lineWidth = Math.round(2 / ratio);
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, img.width, img.width);
                ctx.drawImage(img, 0, 0);
                ctx.lineWidth = lineWidth.toString();
                ctx.beginPath();
                for (let i = 0; i < rects.length; i++) {
                    let rect = rects[i];
                    ctx.rect(rect.x, rect.y, rect.w, rect.h);
                    ctx.strokeStyle = "rgba(0,0,0,1)";
                    ctx.setLineDash([]);
                    ctx.stroke();
                    ctx.strokeStyle = "rgba(255,255,255,1)";
                    ctx.setLineDash([Math.round(5/ratio), Math.round(5/ratio)]);
                    ctx.stroke();
                }                
                ctx.closePath();
            }

            let onmousedown = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.buttons == 1) {
                    isMouseDown = true;
                    let x = e.offsetX;
                    let y = e.offsetY;
                    for (const [key, path] of Object.entries(paths)) {
                        let idx = path.findIndex(elem => ctx.isPointInPath(elem, x, y));
                        if (idx !== -1) {
                            currentIndex = idx;
                            currentAction = key;
                            canvas.style.cursor = key;
                            return;
                        }
                    }
                    currentAction = 'none';
                    canvas.style.cursor = 'auto';
                }
            }

            let onmousemove = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (isMouseDown && e.buttons !== 1)
                    paths = getInteractiveAreas();
                isMouseDown = e.buttons == 1;
                if (isMouseDown && currentAction !== 'none') {
                    let ratio = $(canvas).width() / img.width;
                    let rect = rects[currentIndex];
                    let sX = e.movementX / ratio;
                    let sY = e.movementY / ratio;
                    switch (currentAction) {
                        case "move":        rect['x'] += sX; rect['y'] += sY; break;
                        case "e-resize":    rect['w'] += sX; break;
                        case "w-resize":    rect['x'] += sX; rect['w'] -= sX; break;
                        case "n-resize":    rect['y'] += sY; rect['h'] -= sY; break;
                        case "s-resize":    rect['h'] += sY; break;
                        case "nw-resize":   rect['x'] += sX; rect['w'] -= sX; rect['y'] += sY; rect['h'] -= sY; break;
                        case "nwse-resize": rect['w'] += sX; rect['h'] += sY; break;
                        case "ne-resize":   rect['w'] += sX; rect['y'] += sY; rect['h'] -= sY; break;
                        case "nesw-resize": rect['x'] += sX; rect['w'] -= sX; rect['h'] += sY; break;
                    }
                    draw();

                                        const event = $.Event("actionRect");
                    $(canvas).trigger(event, [currentIndex]);
                    return;
                }
                for (const [key, path] of Object.entries(paths)) {
                    if (path.some(elem => ctx.isPointInPath(elem, e.offsetX, e.offsetY))) {
                        canvas.style.cursor = key;
                        return;
                    }
                }
                canvas.style.cursor = 'auto';
            };

            let destroy = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                rects = null;
                img = null;
                canvas.removeEventListener('mousedown', onmousedown);
                canvas.removeEventListener('mousemove', onmousemove);
            };

            let refreshPieces = function (rs) {
                rects = rs;
                paths = getInteractiveAreas(img, rects);
                draw();
            }

            let init = function (im, rs) {
                destroy();
                img = im;
                canvas.width = im.width;
                canvas.height = im.height;
                canvas.addEventListener('mousemove', onmousemove);
                canvas.addEventListener('mousedown', onmousedown);
                refreshPieces(rs);
            }
            return { init, destroy, refreshPieces }
        }
    }
}
indieauthor.widgets.AnimationContainer = {
    widgetConfig: {
        widget: "AnimationContainer",
        type: "specific-element-container",
        label: "Animation",
        allow: ["AnimationItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    paleteHidden: true,
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.AnimationContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget-animation-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.AnimationContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var template = '<form id="f-{{id}}"> <div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"><label for="width">{{translate "widgets.AnimationContainer.form.width.label"}}</label><input type="number" name="width" class="form-control" value="{{width}}" placeholder="{{translate "widgets.AnimationContainer.form.width.placeholder"}}" required></input><small class="form-text text-muted">{{translate "widgets.AnimationContainer.form.width.help"}}.</small></div><div class="form-group"><label for="height">{{translate "widgets.AnimationContainer.form.height.label"}}</label><input type="number" name="height" class="form-control" value="{{height}}" placeholder="{{translate "widgets.AnimationContainer.form.height.placeholder"}}" required></input><small class="form-text text-muted">{{translate "widgets.AnimationContainer.form.height.help"}}.</small></div><div class="form-group"><label for="image">{{translate "widgets.AnimationContainer.form.image.label"}}</label><input type="url" class="form-control" name="image" required placeholder="{{translate "widgets.AnimationContainer.form.image.placeholder"}}" value="{{image}}" autocomplete="off"/><small class="form-text text-muted">{{translate "widgets.AnimationContainer.form.image.help"}}</small></div>{{#if image}}<div class="form-group"> <p>{{translate "widgets.AnimationContainer.form.prev"}}</p><img class="img-fluid" src="{{image}}"/> </div>{{/if}}</form>';

        var rendered = indieauthor.renderTemplate(template, {
            width: modelObject.params.width,
            height: modelObject.params.height,
            image: modelObject.params.image,
            id: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        });

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AnimationContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.AnimationContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                width: 0,
                height: 0,
                image: "",
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.width = parseInt(formJson.width);
        modelObject.params.height = parseInt(formJson.height);
        modelObject.params.image = formJson.image;
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!widgetInstance.params.width > 0) errors.push("AnimationContainer.width.invalid");
        if (!widgetInstance.params.height > 0) errors.push("AnimationContainer.height.invalid");
        if (!indieauthor.utils.isIndieResource(widgetInstance.params.image)) errors.push("AnimationContainer.image.invalid");
        if (widgetInstance.data.length == 0) errors.push("AnimationContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var errors = [];

        if (formData.width <= 0) errors.push("AnimationContainer.width.invalid");
        if (formData.height <= 0) errors.push("AnimationContainer.height.invalid");
        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("AnimationContainer.image.invalid");

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAC3klEQVRoge2ZT2jTUBzHvw1z4rp1HXTKQNKhTFlhIIpk+Id1F/+DG8zMy5jiKEwv7UVbEWZP7a3z4qFMZAjiuh289LDTNr1sDkQYVJgHuyB4mLC/7iIa+YWmVvNS01qTdvQDgeS9l5dPwnu/l/eeDTnwgngMQA+sJQ3gpbSQWNezyErzghgD4D/Y0gw6rGL+bQoZ8V5pIfFOV4MXxIe8IMrTc29kq9nY2pYvDNyVeUFc4wXRmU967cmLpOXCKiR+qucOiftZvhwviF4Azr7LXRY35V846u0413WSrq+y8jn1hAqWE415fLiyMjVIVbrU7K3d4wxG4t5gJP5bFClraaejnga7GQAfg5H4DTW9UpoHfemn9NVRgW16EBUo3YpKjR41fybISyv4dvqBtuBzP7grJ5Tz1Ic0wrHxvBV7jrRixD+YvZ5KzmEyOZv3nonHI8VJY2OHWVBekoCM9ObWjvo3ZphPn1cLvse4tAE6j3uwMj+RLUgy/bfDCAxdg3+oj1kBpefmGblHj93RpsE3gzvbrkm2dfAmKf0djbSNd6Emeb9sBFkU1ab1iI1NKsf/piTSjoY6pXOyoA7naLDD0+Zm5hczHy2JtKetVTfGujv7FWGjMdgIu2RElL7g+3BcU5AbPp8dEa1G2zykVfx4/V6TbDvTnh0RrWaXDC5FMjo2pRvuKIJQh8yFOqZexClcurGOXVIvPQOFrkIkKEwWi3ZE7HCjdvNZwdXRYo9ZCz7VJQSzqEqbRVXaLKrSZsFlNmVKNr0vFdOvFmGv28esjZMWEiQ9Gx4dx+b217IQpoWd1HIah/gWZr46jAdSy+mZiwP3nLeuX1JmIlZAH216blGRPnqYx35XE9Midx+RllNpL9GrLvRZwQFXkyKsM3ecjYZ83dkfpswO6U1WyWAkLlv1EiyMRg/9nVNzUTyMSgfKQJhawiMYlY6GfLRG26uGRwug53dHQz6rnv+PAPgJZGTQLIzxpiAAAAAASUVORK5CYII="
}
indieauthor.widgets.AnimationItem = {
    widgetConfig: {
        widget: "AnimationItem",
        type: "specific-element",
        label: "Animation Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-animation-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.AnimationItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id
        }

        if (!indieauthor.utils.isEmpty(modelValues.data)) {
            templateValues.image = modelValues.data.image;
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="image">{{translate "widgets.AnimationItem.form.image.label"}}</label><input type="text" class="form-control" name="image" required placeholder="{{translate "widgets.AnimationItem.form.image.placeholder"}}" value="{{image}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.AnimationItem.form.image.help"}}</small></div>{{#if image}} <div class="form-group"><p>{{translate "widgets.AnimationItem.form.prev"}}</p><img class="img-fluid" src="{{image}}"/></div>{{/if}}</form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AnimationItem.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.image ? indieauthor.renderTemplate('<div class="sub1"><span><i>{{image}}</i></span></div><div class="sub2"><p>{{text}}</p></div>', modelObject.data) : indieauthor.strings.widgets.AnimationItem.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                image: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.image = formJson.image;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image)) errors.push("AnimationItem.image.invalid");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("AnimationItem.image.invalid");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACeElEQVRogWNkQAJy5mEGDAwMAQwDCx4wMDBseHRy1QdcroA7Ws48rJ+BgaFARlKUAYQHCpw4d40B6vDARydXXcDpDDnzsAY587D/Ow+e+j/Q4OPnL/89Ysv+y5mHvZczDxPA5+j3c1dsHXAHwwDI4VYB2SCHF2BzL5OceZgDAwODQIi3/QAnZQTg4+FmcLM3BfH9sckzwRgghYMJ8ONxD9OgcimRYNTR1AbsbKwCFe2zHCraZ6GUIoPa0QJ8PKDKbj8DA8P9ivZZCTDxoZI8QCE9HxTqDEMwTcczDEFHKzCMlh50BEPS0SzYBP9ffsjA8PEbqiA/FwOjrjydnIUfYHX034qlDP8OX0cRY7LVZGDZWgXnh2c1wtq+OMHKafUMFkZacGl5i3CS1OMCWB1NDNBSU0BRBfIAHy83g5YqIjb4eLlQ1KA7CF0PunqqO7q+IB6FDwpFkOWg0MIF0OWI0YMNDJ+MyJTpzsBoo4kixqgrRy83EQTYHe1jzMAAwiSCT1++EcycNHM0ueDarQfgUmXIOJrUzAQDxJYYyIBqjiamfKUWGG170AuMOppeYNTR9AKjjqYXGHU0vcCoo+kFmKCTMnRpB5MCdh46zcDNxYlVB9Ojk6tAjj7QOGEhw6cvXweFg9dsPQhumyvJSWKVhzVNC6/derDfM7ZcIDnCi0FLVQGrYloDUKDtPHga7Gh1ZTkGMRFBrDYizyOChlNBc4kOsIG+gQDiIoJgB+OYyzzQUZnmCO8EQGdIE7GprGif9X+gPIENEFt64J45pS8Au4NYRxcOAgeDUsJEBmId3VGZdgA0Vw0rHgcAgOx37KhMGyj7KQQMDAwAoOKne2Zj77sAAAAASUVORK5CYII="
}
indieauthor.widgets.AudioTermContainer = {
    widgetConfig: {
        widget: "AudioTermContainer",
        type: "specific-element-container",
        label: "Audio Term Container",
        allow: ["AudioTermItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.AudioTermContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-audio-term-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.AudioTermContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AudioTermContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.AudioTermContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("AudioTermContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACuUlEQVRogWNkQAJy5mEGDAwMAQwDCx4wMDBseHRy1QdcroA7Ws48rJ+BgaFARlKUAYQHCpw4d40B6vDARydXXcDpDDnzsAY587D/Ow+e+j/Q4OPnL/89Ysv+y5mHvZczDxPA5+j3c1dsHXAHwwDI4VYB2SCHF2BzL5OceZgDAwODQIi3/QAnZQTg4+FmcLM3BfH9sckzwRgghfQCv/hiGf54t+G1jR+Pe5hwygxiQFNH/z9yneH/5YdgNjGhSyygqaN/e7Ux/K1YilcNPs+ws7EKVLTPcqhon4VSilDd0ZSEKLpeAT4eUGW3n4GB4X5F+6wEmDgLukZQdP62rsFrOOvRFgZGXXmyHEYmAIX0/Ir2WQ86KtMOYIb0x2+EjUVTAwodaqVXAiCeYQiWHgoM2JIHKNqZK4Pw6kRPGixbq6juOnwAw9EM/FwMzJWBdHUEqQDT0RQCtk+LyTaAWL1UdzQyYN1WBY45fIAcT9LU0Yw2mnA2JTGADoZk24OmIY0LUBrqwyekof00nMDCSIuebsQAGI4GOTg8qwGvppXTGjAcTsijxAA+Xi4GLVUF0h0NAf9JtjA8q5FiR4MCYuW0eoLqcDiaEbswHkCMZYQAKKSJARiOhvgWf/LAlqbpmc6xhvRAZzRCYLRjSy8w6mh6gdEakVIwWiMSA0ZrRAJgtEakF2CCTspQJfdTE+w8dJqBm4sTq4lMj06uAjn6QOOEhQyfvnwdFA5es/Ugw7VbDxiU5CSxysPSdOG1Ww/2e8aWCyRHeBFVVtICgAJt58HTYEerK8sxiIkIYrUFeR4RNJwKmkt0gA30DQQQFxEEOxjHXOaBjso0R3jpAZ0hTcSmsqJ9Fum1DQ0BsaUH7plT+gKwO4h1dOEgcDAoJUxkINbRoCkD0Fw1rHgcAACy37GjMm2g7KcQMDAwAADM09jiVfIvDQAAAABJRU5ErkJggg=="
}
indieauthor.widgets.AudioTermItem = {
    widgetConfig: {
        widget: "AudioTermItem",
        type: "specific-element",
        label: "Audio Term Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-audio-term-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></i></div><div class="b2" data-prev><span>{{translate "widgets.AudioTermItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            term: modelObject.data.term,
            definition: modelObject.data.definition,
            audio: modelObject.data.audio,
            captions: modelObject.data.captions
        }

        var template = '<form id="f-{{instanceId}}"><div class="form-group"><label>{{translate "widgets.AudioTermItem.form.term.label"}}</label><input type="text" class="form-control" name="term" value="{{term}}" placeholder="{{translate "widgets.AudioTermItem.form.term.placeholder"}}" autocomplete="off" required/><small class="form-text text-muted">{{translate "widgets.AudioTermItem.form.term.help"}}</small></div><div class="form-group"><label>{{translate "widgets.AudioTermItem.form.definition.label"}}</label><textarea class="form-control" name="definition" placeholder="{{translate "widgets.AudioTermItem.form.definition.placeholder"}}" required>{{definition}}</textarea><small class="form-text text-muted">{{translate "widgets.AudioTermItem.form.definition.help"}}</small></div><div class="form-group"><label>{{translate "widgets.AudioTermItem.form.audio.label"}}</label><input type="url" class="form-control" name="audio" placeholder="{{translate "widgets.AudioTermItem.form.audio.placeholder"}}" value="{{audio}}" autocomplete="off" required/><small class="form-text text-muted">{{translate "widgets.AudioTermItem.form.audio.help"}}</small></div><div class="form-group"> <label for="text">{{translate "common.captions.label"}}</label><input type="url" class="form-control" name="captions" placeholder="{{translate "common.captions.placeholder"}}" value="{{{captions}}}" autocomplete="off"></input><small class="form-text text-muted">{{translate "common.captions.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.AudioTermItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.data.term && modelObject.data.definition && modelObject.data.audio)
            element.innerHTML = modelObject.data.term + " -> " + modelObject.data.definition + " | (" + modelObject.data.audio + ")";
        else
            element.innerHTML = indieauthor.strings.widgets.AudioTermItem.prev;
    },
    emptyData: function (options) {
        return {
            data: {
                term: "",
                definition: "",
                audio: "",
                captions: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.term = formJson.term;
        modelObject.data.definition = formJson.definition;
        modelObject.data.audio = formJson.audio;
        modelObject.data.captions = formJson.captions;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.term.length == 0)
            errors.push("AudioTermItem.term.invalid");

        if (widgetInstance.data.definition.length == 0)
            errors.push("AudioTermItem.definition.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.captions) && !indieauthor.utils.isIndieResource(widgetInstance.data.captions))
            errors.push("common.captions.invalid");

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.audio))
            errors.push("AudioTermItem.audio.invalid");

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (formData.term.length == 0)
            errors.push("AudioTermItem.term.invalid");

        if (formData.definition.length == 0)
            errors.push("AudioTermItem.definition.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(formData.captions) && !indieauthor.utils.isIndieResource(formData.captions))
            errors.push("common.captions.invalid");

        if (!indieauthor.utils.isIndieResource(formData.audio))
            errors.push("AudioTermItem.audio.invalid");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACk0lEQVRoge2Zz2vTYBjHv83mxG1sGUxlIK9DEZ0w8CIBsay7+GsHJ0gQdKgIPWyX7aKpJ72Y3tSLh4KI+AMpol566Gmtu1gHIgwq7GLtPzA3p6e1kTcsXUqTNE2yvAnkA4U0ed++n/fJ07dv88SggwjiKQDTYEsFwKdqKfvbzKIhTQTxMYD5QyP7QV+s+PKtjG3xK9VS9rupBhHEB0QQlXzxq8Ka9T+byoWZuwoRxDUiiLyV9NrzdznmwhpU/Mz0HBWfN/LliCAmAPBXpyYYp/IOA/19ODdxmr6/bHSd0w5owyAxaOHDBcrUJpG01+zt2cNLciYhyZmmVSTQ0vxAP/2xWwTwU5Izt7TzYUkPGukXNOoIYU7fRAilR8FKuiZ/RP3NkuP+jKQ/oP42BNJuo6tnV6W3ph6hJr1Wj82i62QynkvrJepLP6CsVNu035mM3Ql0t5xZ/4fas7xlp67Z88Bgr6kEFx8Ddz3ednCnfVuklZVfamcruPgJxM6ONVpo0XEi6gRP0oPeXjerQae0pofJbbdqExsnvgnDSDo2fhg9G686+pCu9A0vndri+epBv0hOI2+3b2t6uKQ7d9+xqN2+nkvr0aeZWRQ7nSR2W7ppIAdyZjDZMLnJe/gZ6aZBXUY9+jfuF5G0X0TSfhFJ+0VopWlRRivQBIb852X09e4zlq6WslS68PDJS2xs/g2E8/tcEeXVCo6QEcPr2t5jobxaWbw4c4+/c+0STh4b9VVSgwYtX1xWpY8fJTgwPGTYTl9HpI9TaS0xoT3oY8HB4SFV2KSWWUinkpONXd52hfS2UUtJziisJmGE3dXDvHLqL6qHXemFAAjTTHgKu9LpVLJAa9Xa8sgAOv5kOpVkNb5LAPwHyz3KdqgqcKEAAAAASUVORK5CYII="
}
indieauthor.widgets.Blockquote = {
    widgetConfig: {
        widget: "Blockquote",
        type: "element",
        label: "Blockquote",
        category: "simpleElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var itemTemplate = '<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/>  <br/> <span> {{translate label}}</span></div>';
        var item = {};
        item.content = indieauthor.renderTemplate(itemTemplate, {
            category: this.widgetConfig.category,
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            label: "widgets.Blockquote.label"
        });

        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id,
            prev: "widgets.Blockquote.prev"
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-blockquote" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate prev}}</span></div><div class="b3" data-toolbar> </div></div';
    },
    getInputs: function (modelValues) {
        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="quote">{{translate "widgets.Blockquote.form.quote.label"}}</label><textarea rows="3" class="form-control" name="quote" placeholder="{{translate "widgets.Blockquote.form.quote.placeholder"}}" required>{{quote}}</textarea><small class="form-text text-muted">{{translate "widgets.Blockquote.form.quote.help"}}</small></div><div class="form-group"><label for="caption">{{translate "widgets.Blockquote.form.caption.label"}}</label><input type="text" class="form-control" name="caption" value="{{caption}}" placeholder="{{translate "widgets.Blockquote.form.caption.placeholder"}}" autocomplete="off"></input><small class="form-text text-muted">{{translate "widgets.Blockquote.form.quote.help"}}</small></div><div class="form-group"><label for="source">{{translate "widgets.Blockquote.form.source.label"}}</label><input type="text" class="form-control" name="source" value="{{source}}" placeholder="{{translate "widgets.Blockquote.form.source.placeholder"}}" autocomplete="off"></input><small class="form-text text-muted">{{translate "widgets.Blockquote.form.source.help"}}</small></div><div class="form-group"><label for="alignment">{{translate "widgets.Blockquote.form.alignment.label"}}</label><select class="form-control" name="alignment"><option value="left" {{#ifeq alignment "left"}}selected{{/ifeq}}>{{translate "widgets.Blockquote.form.alignment.values.left"}}</option><option value="right" {{#ifeq alignment "right"}}selected{{/ifeq}}>{{translate "widgets.Blockquote.form.alignment.values.right"}}</option></select><small class="form-text text-muted">{{translate "widgets.Blockquote.form.alignment.help"}}</small></div></form>';

        var rendered = indieauthor.renderTemplate(inputTemplate, {
            instanceId: modelValues.id,
            caption: modelValues.data.caption,
            quote: modelValues.data.quote,
            alignment: modelValues.data.alignment,
            source: modelValues.data.source
        });

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Blockquote.label
        };

    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {

    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.quote ? modelObject.data.quote : indieauthor.strings.widgets.Blockquote.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                quote: "",
                caption: "",
                alignment: "",
                source: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.quote = formJson.quote;
        modelObject.data.caption = formJson.caption;
        modelObject.data.alignment = formJson.alignment;
        modelObject.data.source = formJson.source;
    },
    validateModel: function (widgetInstance) {
        if (widgetInstance.data.quote.length == 0)
            return {
                element: widgetInstance.id,
                keys: ["Blockquote.quote.invalid"]
            };

        return undefined;
    },
    validateForm: function (formData) {
        if (formData.quote.length == 0)
            return ["Blockquote.quote.invalid"];

        return [];
    },
    icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAwCAYAAABuZUjcAAAACXBIWXMAAAsSAAALEgHS3X78AAADIUlEQVRoBe2ZX0hTURzHv/snoTYTLB+qmwRFGZYVsiD/TAgV6cEeWpGNJGLVXtKXcFAvQW0vMXrxYfTHFwktwqAkn1RWkEEgFBr2so2gB3tw/tmD5m78bt65/57dde5m7AOXnXvO714+99yzcznnh62KJtpbMFm6AdwCUJXj5xkG0BOYHPKlCoiICybLMwBdVy+2o7WxTjXDeH78nMOTwRFMz/rmATQHJoemUgYLJotZMFnE0YlPYj4QXFwS26y3RcFkGUvlrF3/vdLSVIeWHPZ0NMbSEjy8e5NqqEOTDltZvOrIgVwP61iqN3zSim85mMXF9zMQv/iTtq31jar+3GziwRB+3/BA9P9KaCLp8ICXg1p69CxBawNeaPbthPbsycQ25ysYnndzE2w0HXPv6ThD8/kjl8M2Ltcz9TjJhb0zWDFasbL3+kY9DZFgCKvtD6Q2HkOmyKCvBdABYKzX6enKSJzkNi3Hx/HBnZl4/rCj1+kxM4trhIpNy/FxvGH6cxq+upPWazsbUNTZkJPX8f9/gPKNgrjabFlxplmFViV08OLUiWo+4i/fTsD9+AU3cf/HwYyvYRKnHum5dl6JEzeYxZW8Tp4UZhW1KYirDTfx1dN3/q6YjFapLBN+8zlSTwedK4GbePSOQGw5EBcXe85KYagkUFa8UZOqHN+WAUwfICUYPtwHAnPSfoy2szFyB529FdqjAsLeb1jrewedwhUUtx6X159iMCTJxrTVH5Z2xnT2NsU9zn2M612Xk8ppaoSEB8rovll6pYV6VlOfPEJHD5QFhVlFbSLiwaXlvBLbbMUli7+mVc5CHsmTT5FBj10V5UnbZfH+hcXl+Qv2e1zXlqw8HRyRloo1h/anvCQ6XUjbuZQyrK0+WAVjqbL5NVumv/uxsLgsSacQb6Z98sh0uJ5PPE6pw+lZnzk6Uthd2VS2vcScpRMTlLSqrChHSfG2tHEJ83hgcoh2/cej6y45PZRyUEWcAUrcMk+Hw/IFOcbnctimmMVdDhvlYHpyLE0dd04+0aSPjaXX6aFkaVcm1/wjSLrf5bDlw1vPAgB/AO1fcZ9mjVkZAAAAAElFTkSuQmCC"
}
indieauthor.widgets.ButtonTextContainer = {
    widgetConfig: {
        widget: "ButtonTextContainer",
        type: "specific-element-container",
        label: "Buttons with text",
        allow: ["ButtonTextItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.ButtonTextContainer.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-button-text" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.ButtonTextContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label for="instanceName">{{translate "common.name.label"}}</label>
            <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
            <small class="form-text text-muted">{{translate "common.name.help"}}</small>
          </div>
          <div class="form-group">
            <label for="help">{{translate "common.help.label"}}</label>
            <div class="input-group mb-3">
              <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}" />
              <div class="input-group-append">
                <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
              </div>
            </div>
            <small class="form-text text-muted">{{translate "common.help.help"}}</small>
          </div>
        </form>`;

        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.ButtonTextContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.ButtonTextContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0)
            errors.push("ButtonTextContainer.data.empty");


        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAqFBMVEUAAAAeN1YeN1Z4h5owR2MjPFp4h5oeN1YeN1Z4h5ooQF5OYXl4h5ozSmZ4h5orQ2AmPlx4h5p4h5oqQV8eN1Z4h5oeN1Z4h5p4h5p4h5r///94h5oeN1b5DVz8hq2Om6pWaIDHzdU9Um39wtbcZo3rOXTx8vQ4Tmq4wMpygpVHXHWqtL/+4evj5urV2d/9pMKcp7X7Z5lecIf6SYT5G2aAjqBGWnQqQl/wyqdVAAAAGnRSTlMAQIDA0PdAMBDw6yDg3NDMpqCQkHBgYFAwEMgBv1gAAAD/SURBVEjH1c9pU4MwEIDhWAV6eN8mG6CiCUfvVv3//8y4TQeHkqx+6Ax9P2XIQ2aXmaIe0WOf7boDnfqDYWRtD3JOpMrAvh0sOJnS92hPQHG6jzOLuW2WVM7/kgYuAOBryk1xjB8Aa8UzvCrMabLZTAic4JU2p6WUyz18Eb78whVepZxn0pQ18asYPNRYaTDlnK9/8HofCxEixqZFmho7l9i8Bd8gpkN8etRYOuryzIdbMHPU5QXfHbXi2FGXF/zXzG+Ourzgn/AIxpyu/ETMrkpF2gpWWxwFejH2lhdQii1m/esh+NMrYfEu4auJL0l8W+OQsoMRq3s69w/xzL4BGGHGT7oqAiYAAAAASUVORK5CYII="
}
indieauthor.widgets.ButtonTextItem = {
    widgetConfig: {
        widget: "ButtonTextItem",
        type: "specific-element",
        label: "Buttons with text Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.ButtonTextItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            image: modelValues.data.image,
            alt: modelValues.data.alt,

                    }
        var template = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label for="image">{{translate "widgets.ButtonTextItem.form.image.label"}}</label>
            <input type="url" class="form-control" name="image" required placeholder="{{translate "widgets.ButtonTextItem.form.image.placeholder"}}" value="{{image}}" autocomplete="off" />
            <small class="form-text text-muted">{{translate "widgets.ButtonTextItem.form.image.help"}}</small>
          </div>
          <div class="form-group">
            <label for="alt">{{translate "common.alt.label"}}</label>
            <input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/>
            <small class="form-text text-muted">{{translate "common.alt.help"}}</small>
          </div>
          {{#if image}}
            <div class="form-group">
              <p>{{translate "widgets.ImageAndText.form.preview"}}</p>
              <img class="img-fluid" src="{{image}}"/>
            </div>
          {{/if}}
          <div class="form-group">
            <label for="text-{{instanceId}}">{{translate "widgets.ButtonTextItem.form.text.label"}}</label>
            <textarea rows="10" class="form-control texteditor" id="text-{{instanceId}}" name="text" required>
            </textarea>
            <small class="form-text text-muted">{{translate "widgets.ButtonTextItem.form.text.help"}}</small>
          </div>
        </form>`;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SentenceOrderItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        let $editor = $('#f-' + modelObject.id + ' .texteditor');
        indieauthor.widgetFunctions.initTextEditor(modelObject.data.text, $editor);
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.alt ? modelObject.data.alt : indieauthor.strings.widgets.ButtonTextItem.prev;
    },
    emptyData: function (options) {
        var object = {
            data: {
                text: "",
                image: "",
                alt: ""
            }
        };
        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.text = indieauthor.widgetFunctions.clearAndSanitizeHtml(formJson.text);
        modelObject.data.image = formJson.image;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.text.length == 0) errors.push("ButtonTextItem.text.invalid");
        if (indieauthor.widgetFunctions.isEmptyText(widgetInstance.data.text)) errors.push("TextBlock.text.invalid");
        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image)) errors.push("ButtonTextItem.image.invalid");
        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid")
        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var errors = [];

        if (formData.text.length == 0) errors.push("ButtonTextItem.text.invalid");
        if (indieauthor.widgetFunctions.isEmptyText(formData.text)) errors.push("TextBlock.text.invalid");
        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("ButtonTextItem.image.invalid");
        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid")
        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAqFBMVEUAAAAeN1YeN1Z4h5owR2MjPFp4h5oeN1YeN1Z4h5ooQF5OYXl4h5ozSmZ4h5orQ2AmPlx4h5p4h5oqQV8eN1Z4h5oeN1Z4h5p4h5p4h5r///94h5oeN1b5DVz8hq2Om6pWaIDHzdU9Um39wtbcZo3rOXTx8vQ4Tmq4wMpygpVHXHWqtL/+4evj5urV2d/9pMKcp7X7Z5lecIf6SYT5G2aAjqBGWnQqQl/wyqdVAAAAGnRSTlMAQIDA0PdAMBDw6yDg3NDMpqCQkHBgYFAwEMgBv1gAAAD/SURBVEjH1c9pU4MwEIDhWAV6eN8mG6CiCUfvVv3//8y4TQeHkqx+6Ax9P2XIQ2aXmaIe0WOf7boDnfqDYWRtD3JOpMrAvh0sOJnS92hPQHG6jzOLuW2WVM7/kgYuAOBryk1xjB8Aa8UzvCrMabLZTAic4JU2p6WUyz18Eb78whVepZxn0pQ18asYPNRYaTDlnK9/8HofCxEixqZFmho7l9i8Bd8gpkN8etRYOuryzIdbMHPU5QXfHbXi2FGXF/zXzG+Ourzgn/AIxpyu/ETMrkpF2gpWWxwFejH2lhdQii1m/esh+NMrYfEu4auJL0l8W+OQsoMRq3s69w/xzL4BGGHGT7oqAiYAAAAASUVORK5CYII="
}
indieauthor.widgets.ChooseOption = {
    widgetConfig: {
        widget: "ChooseOption",
        type: "element",
        label: "Choose option",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.ChooseOption.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-choose-option" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.ChooseOption.prev"}} </span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            text: modelValues.data.text,
            image: modelValues.data.image,
            options: modelValues.data.options,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        };

        var template = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.ChooseOption.form.text.label"}}</label> <textarea class="form-control" name="text" placeholder="{{translate "widgets.ChooseOption.form.text.placeholder"}}" required>{{text}}</textarea> <small class="form-text text-muted">{{translate "widgets.ChooseOption.form.text.help"}}</small> </div><div class="form-group"><label for="image">{{translate "widgets.ChooseOption.form.image.label"}}</label><input type="url" class="form-control" name="image" required autocomplete="off" placeholder="{{translate "widgets.ChooseOption.form.image.placeholder"}}" value="{{image}}"/><small class="form-text text-muted">{{translate "widgets.ChooseOption.form.image.help"}}</small></div><div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div>{{#if image}}<div class="form-group"> <p>{{translate "widgets.ChooseOption.form.preview"}}</p><img class="img-fluid" src="{{image}}"/> </div>{{/if}}<div class="form-group"> <label>{{translate "widgets.ChooseOption.form.options.label"}}</label>{{#each options}}<div class="input-group input-answer"> <div class="input-group-prepend"> <div class="input-group-text"> <input type="radio" name="correct"{{#if correct}}checked="true"{{/if}}value="{{@index}}"> </div></div><input class="form-control" type="text" name="option{{@index}}" autocomplete="off" placeholder="{{translate "widgets.ChooseOption.form.options.placeholder"}}" value="{{text}}" autocomplete="off"/> </div>{{/each}}<small class="form-text text-muted">{{translate "widgets.ChooseOption.form.options.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.ChooseOption.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.name && modelObject.data.text)
            element.innerHTML = modelObject.params.name + " | " + modelObject.data.text;
        else
            element.innerHTML = indieauthor.strings.widgets.ChooseOption.prev;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: "",
            },
            data: {
                text: "",
                image: "",
                alt: "",
                options: [{
                    text: "",
                    correct: false
                },
                {
                    text: "",
                    correct: false
                },
                {
                    text: "",
                    correct: false
                },
                {
                    text: "",
                    correct: false
                }
                ]
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formData) {
        var options = [];
        for (var i = 0; i < this.extensions.optionsNumber; i++) {
            var option = formData["option" + i];
            if (option && (option.length > 0)) {
                var optionObj = {};
                optionObj.text = option;

                if (parseInt(formData.correct) == i)
                    optionObj.correct = true;
                else
                    optionObj.correct = false;

                options.push(optionObj)
            }
        }

        modelObject.data.options = options;
        modelObject.data.image = formData.image;
        modelObject.data.text = formData.text;
        modelObject.params.name = formData.instanceName;
        modelObject.params.help = formData.help;
        modelObject.data.alt = formData.alt;

    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.text.length == 0)
            errors.push("ChooseOption.text.invalid");

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            errors.push("ChooseOption.image.invalid");

        if (this.extensions.optionsWithoutCorrect(widgetInstance.data.options))
            errors.push("ChooseOption.options.noCorrect");

        if (widgetInstance.data.options.length != this.extensions.optionsNumber)
            errors.push("ChooseOption.options.notEnougOptions");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid")

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;

    },
    validateForm: function (formData, instanceId) {
        var errors = [];
        var options = [];

        for (var i = 0; i < this.extensions.optionsNumber; i++) {
            var option = formData["option" + i];
            if (option && (option.length > 0)) {
                var optionObj = {};
                optionObj.text = option;

                if (parseInt(formData.correct) == i)
                    optionObj.correct = true;
                else
                    optionObj.correct = false;

                options.push(optionObj)
            }
        }

        if (formData.text.length == 0)
            errors.push("ChooseOption.text.invalid");

        if (!indieauthor.utils.isIndieResource(formData.image))
            errors.push("ChooseOption.image.invalid");

        if (this.extensions.optionsWithoutCorrect(options))
            errors.push("ChooseOption.options.noCorrect");

        if (options.length != this.extensions.optionsNumber)
            errors.push("ChooseOption.options.notEnougOptions");

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid")

        return errors;
    },
    extensions: {
        optionsNumber: 4,
        optionsWithoutCorrect: function (options) {
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.correct)
                    return false;
            }

            return true;
        },
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADPUlEQVRoBe2ZT0gUURzHvy5atOq6ghZCTVJUJARRyERF6kVyDTKQ0YtFBgvZZZcidwkz67BbINalYKM/dgizDl0s7OJulzJDAmsOdlmXoIOB/710mPgNO2YwM/ue7uzYsh9YnMU3bz4783u/35v38rAKQZQOAmiCvcQBvE6MDs4aWaxIC6LUB8C3vaIc9LGLj+MykuJnEqODXww1BFG6IYiSMhz7pNjN3MKicrLtqiKI0owgSm4z6ZlHA0O2C2uQ+NGmSyTu0/N1CKJUC8Dd3Fhjcyj/xVVUiPqaavp+Wu//Du2AGm4kSkx8HBvKlJGcdLrZvKnAHQhFagOhyD9ZJN/sOvL3OHr6+rXcmXaoHtCA6/ad0+3a7SqiYjcCYDYQivjDQe9TU+n5xSW0dNxUj9tbPaYDY618GP+GxwNvsKOiHO0tHrNe6E4/CYQi8XDQGzWUlienML+whId3rqD+RLUld9qHZjSc7cRwbCyVtAY9kmjKmLY6FbqKnDzNK5HLHhkkJ50pUkpT6rOS+cVl7t4NU96RQ1VwFRfi8q0HaG6ULcvT8mQc3X794mKEaUV8cf+6Kk0FwAqoIlLhYszRK5hKV+2pxNtnty0RXg//5UA0vdOYW4YyMcXWU4kTeQd2qoc0eGkawIKr2Kk+0bRJ/z52DUriF3NnBV/7kCeUqTPDV0Mx5vN6uzrA87pnGh48wiqJafXPj5/TXKfxts++mM5/7oMykWDriWL6+H71kPLuu9hnZon21gbmtkgl7Th1GKAPJzSweAcXD9kXHj13+9UyywKV/N6ui+pLA2WOl0NRZgkKJ54nYyrNW77lFo86ZyFhnpdhin8e6eybmlbtZf/1FB7aEjHPeUjOKHkwDY+1TpZoHcNoLSMd5F63MkVOOlM4kpsyli0yrpXh92ModG7RPduRGB0k6ShVP6vfvFmhikqVeJdQoXuGlvL88mR8pKGt032h1WPpZMcMumm0GEnS+3YL2FpWqtt69T4iLafSXmKtttBnB9vKSlVhg73MaDjorVspLskd0vN6LQOhiGLXj9CDNXsY75xmFtWDVdq/AYQpEu6BVZq2DGivWkuPNkDXrwsHvXZdf50A+AOSff+MuTdefAAAAABJRU5ErkJggg=="
}
indieauthor.widgets.ColumnLayout = {
    widgetConfig: {
        widget: "ColumnLayout",
        type: "layout",
        allow: ["element", "specific-element-container"],
        columns: [2, 3, 4],
        category: "layouts",
        toolbar: {
            edit: false
        }
    },
    createPaletteItem: function () {
        var item = {};
        var items = '';
        for (var i = 0; i < this.widgetConfig.columns.length; i++) {
            var columns = this.widgetConfig.columns[i];
            items += indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}" data-columns="{{columns}}"> <img src="' + this.icon["c" + columns] + '" class="img-fluid"></i> <br/> <span>{{columns}} {{translate "widgets.ColumnLayout.columnsLabel"}} </span></div>', {
                widget: this.widgetConfig.widget,
                type: this.widgetConfig.type,
                columns: columns,
                category: this.widgetConfig.category
            });
        }

        item.content = items
        item.numItems = this.widgetConfig.columns.length;

        return item;
    },
    createElement: function (widgetInfo) {
        var content = indieauthor.renderTemplate(this.template(widgetInfo), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return content;
    },
    template: function (widgetInfo) {
        var container = "";
        for (var i = 0; i < widgetInfo.columns; i++) {
            container += '<div class="col-' + (12 / widgetInfo.columns) + '"><div data-role="container" data-widget="' + this.widgetConfig.widget + '" data-type="' + this.widgetConfig.type + '" data-index="' + i + '" class="element-container dragula-container"></div></div>';
        }
        var colTemplate = '<div class="widget-base widget-column-layout" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon["c" + widgetInfo.columns] + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate "widgets.ColumnLayout.label"}}</span></div><div class="b3" data-toolbar></div></div><div class="row">' + container + '</div></div>';
        return colTemplate;
    },
    getInputs: function (modelObject) {},
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {},
    emptyData: function (widget) {
        var object = {
            params: {
                columns: widget.columns
            },
            data: []
        };

        for (var i = 0; i < object.params.columns; i++)
            object.data.push([]);

        return object;
    },
    updateModelFromForm: function (formJson) {},
    validateModel: function (widgetInstance) {
        for (var i = 0; i < widgetInstance.data.length; i++) {
            if (widgetInstance.data[i].length == 0)
                return {
                    element: widgetInstance.id,
                    keys: ["ColumnLayout.data.empty"]
                };
        }

        return undefined;
    },
    validateForm: function (formData) {
        return [];
    },
    icon: {
        c2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACMElEQVRoBe2ZQUgUURjH/06mlGIjbIkgDykk6tRFBgJxvUTWIQUZhJAMYS9d9GK7nuw0eyuvCxERRSxRXfawJ3fbi6sQnVbw0rLnwDQ7uhPf4KjBzJvRHd6bhfeDBzM73/fmN4/HN8t8HTgFM8w7AKYglzqAr41q/refxbE0M8yXABaHBq+Chiw2vtdwJD7dqOZ/+Goww1xlhmkXy5u2bPb+HNj355ZtZpi7zDB1nvTu648F6cIuJH536hmJL3r5aswwkwD0mYfjkrfyCX29Pbg3Pkrnj7yua+4BBcaJKxwfLVamIVHSUdPddVFPW7lk2sr9V0ViLa339dLLbh3Az7SVm3d/b5ftQSv9hladTjqDopvvK2h+qHBjOgsrkef68ARAKVDabvxCs7J9lokjyfVhGGFW+kJm2hnnoZVcHqrkiUJJi6ItpQOrx6H1BYfWZ25M1/67yHN5BEp3sAS0sVtnnrjVXB6B0trjMWech1ZyuU6RzygAJS0KJS0KVaejzOWh6rQolLQolLQolLQo2laamjJugyY2FL9toefyJW/pRjVP0qUXr95i/+BvLJw/Fcqo7dRxnQ16Xndf40u1nfr65NxzfWH2AW6PDAuVdKFFK5a3HOmbNxiuJfo94073EelzKvUSk+6HPhkMJPodYZ9eZimbSU0c/2E66pA+9YpMWzlb1kN4EbZ6+HdOxeJ4hJVeioEw7YQ1hJXOZlIl6lW75VECdP+JbCYl6/4tAuAfoamvJZHAyOIAAAAASUVORK5CYII=",
        c3: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACl0lEQVRoge2Zz2vTYBjHv03nxG60HbTKQF6HIjqh4EUCYll3Ed0ObiJB1KIi7OJlu2jrSS+2N/VaEBERpHjw0kNPa9WDdSCC0MEu1v4Dc3N68Ffkicnc5HlnkkmSQT5QaNpv3/eTt8mTkCeCNQhVOwxgAv7SAfCs26p+lFmsSgtVuwNgevdgGvTyi1dv2jDFJ7ut6luphlC1m0LV9Hrzte43S59W9BP5a7pQtUWhasmNpBfvP6n5LmxB4kcnrpL4NOerCFXLAUieGR/x+VD+Q7y/D8dHjtD2Ke57xXpDwSCR2MBHCZSpTULp/8323m3JQqmSK5Qq66pIoKWT8X662M0CeF8oVS5Zn2+Vw4NW+gGtOm30cAn93Qf8KDxmf62cy0I5n3WVJb6P32azkYxAtHzhX/IXATRYaSx9wc8X8/zgx4bdZwFp1uZfPgTZStNkvcuPbI3iJEs4ycoIS55XhNJesSWl+Tr9ch7fxvh6Gi2eRrQ46SpLfI3n2aySHUZP7YZ7aSRixiAcEZFynzXl2GxG2BKWSkcye2zvtZOsMaGDrIzwRPSKUNorpHd5dMvJItLrq4KTrFlOWRIx46S2g/R+2naddpAlZNnN12mRNibkBz/oPmvuCAdX0x1J0wB/r5AMJ9nf0vazMsLq4RWhtFeE0l4RSnuFYjZlrAZNYKg/n0NfbAe/0t1WlaQbt+4+xPLK50A4P6010V7oYK8YZL+3LuMz7YXO7Mn89eSVs2M4tH/IU0kLWrR6c86QPrBPYGdqgM2t7SPS41TqJeasB31+sCs1YAhLepmNcnFqdPWGyeyQXuaShVJF92snOOxWD3nn1FsMD7vSMwEQpiPhHuxKl4tTDepVW+XRB2j+0XJxyq/5NwmAX7rmz3PWi3K4AAAAAElFTkSuQmCC",
        c4: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADB0lEQVRoBe2ZQWjTUBjHv7bbxG60HVRlIHEoohMKXiQglnUX0e3gBhKEWlSEXrxsF2096cX2pl4LIqIdUkS9VOhprfVgHYgw6GQXa64Kc3PuoLaRL/R176XJW1YliZAfFPL6T9Lfe0m+PPo8QCGI0nEAmAZ7aQDAS7lW+GZk0ZEWROkuAMzuH9kD+LGLt+/r0BafkWuFD4YagijdEkRJKVXeKXaz9n1DOZO4rgiitCqIUognvfrgadF2YQKKn5y+huKzer5eQZRiABA6PzVu8628RWBoEE6Pn8D2Ob3cSzZwRycR5Ph4HWVqElf6X7NroD+UyuRiqUyOqSKOlg4FhvBltwAAn1KZ3GXy/f9ye+BIP8RRx0Yfb8/fU3eYti8bB0/kgLqtLH2GZirP5H3Fm53tVr4Krflqp+2JCODLXuy0m6knoCzJhrkBlwCgzJVuVZdZ6bXNrcbaZldOo8hfmVx7SVGYlxswCtuN9MD6Y8PMc2qMm/vSM+rHCPqq7BS35FmFK20V3AexmXnB9jAeBY8QVrfV6pCvMjn94ClvlqFV/dhp43F4PAGPxXMY5Ty2kX7OSkePArSlQf7SldPSKEzn3ugYKz1fZUueJu9Zuv8VW5bIi4Vsa3MaFFA7SQj62Q5m42zd1+Q9S2MtNiTo5+bqbUSuil5ODcBOcauHVbjSVsF9EH8GEkwbqwV5+LAO/5pkp670BAprvLbk0ZMknPZqS57ZSRRXGk/EQJeloL87p1BfFlSO82UmjwjMZdbmPUvzeo4li5erdZrzsjAx4Tc+d89H2ogrbRWutFW40lbhSluFt70oQxZoHEPp9SIM+nfrj7RcK6B0+fa9R7C+8cMRzs+KFaivNOCgMKKbk7nHXH2lsXA2cSN09cIkHDs8aqkkAQetVFlUpY8cEmBveFh3P3odEf9OxbXEGPmjzw72hYdVYYO1zHI2nZzozPLaK6RX9PZMZXKKXZ3Qw2z1MF45tRbVw6z0nAOE8U64D2als+lkGdeqSXm0Afz9iWw6adfv/yUA8AcZbfJgqCxy0gAAAABJRU5ErkJggg=="
    }
}
indieauthor.widgets.CorrectWord = {
    widgetConfig: {
        widget: "CorrectWord",
        type: "specific-element-container",
        label: "Correct word",
        allow: ["CorrectWordItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.CorrectWord.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-correct-word" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.CorrectWord.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label for="instanceName">{{translate "common.name.label"}}</label>
            <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
            <small class="form-text text-muted">{{translate "common.name.help"}}</small>
          </div>
          <div class="form-group">
            <label for="help">{{translate "common.help.label"}}</label>
            <div class="input-group mb-3">
              <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}" />
              <div class="input-group-append">
                <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
              </div>
            </div>
            <small class="form-text text-muted">{{translate "common.help.help"}}</small>
          </div>
        </form>`;

        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.CorrectWord.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.CorrectWord.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0)
            errors.push("CorrectWord.data.empty");


        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAvVBMVEUAAAAeN1YeN1Z4h5ovRmI3TGgjPFp4h5oeN1Z4h5ooQF54h5p4h5p4h5ozSmZ4h5omPlwqQV8eN1Z4h5oeN1Z4h5oeN1b///8eN1Z4h5qOm6rHzdVWaIA9Um3+4Or5DVz9wtbx8vQrQ2BygpX5HWf8jrP7XpJHXHX7Tof6LXLj5ur+0eDV2d+4wMqAjqDsdp3vPXg5T2r9vtSqtL+cp7X9rsn7bp1jdIr/7/T+z979nr78fqhcboX6PX1GWnQ8cNfCAAAAF3RSTlMAQIDA0BD3QDDw65go4NzQppBwYGBQIGoLbbUAAAF/SURBVEjH1dT7V4IwFAdwKt/a+7GLGLiBA0woFB9p9f//WW1AYx3H1m/V13N2ED5e7+XALJbeqSF3besr15BN9IFBr7KnkCBDcNipandyZAzObgp7Arg+lyRYrdNWhcWZOQEgaj0+wg6wOAYskhKS1v+jx3KwDysZX3TbjRiHADCW8KPdv23ACwI8PpawbXcLLEw1XUKgTIhlPJTxipR95iCSyfhMwmNgSRHyQYoSC7OdwA+wuP6PMFFZ0oAXRGEXR1iXP42fptOpq1pU+MXzvGfV8osD+uLVXuqwu2ET5SFChxn/RiO3GbsxM5g4rGSwRq/xQdfG+4ZfmfDDWcA+up4pZQuuHp/I2zcNyHvbx3z1fVRWjmJXiVl7FLnBmu9xMC/tElGm1ZUp3UT8YJsWt6z4IY2aeo6Cok6xZ7n1bDJ+EDvybiffQ/Qt4UeBrVaIkSkr2Ja418lyR5vEh9AusdW+GoA+2ZtdYhHbFBlfGvGwxl2T7Y+sOvfn+iZG1idv5LZVG7+gBgAAAABJRU5ErkJggg=="
}
indieauthor.widgets.CorrectWordItem = {
    widgetConfig: {
        widget: "CorrectWordItem",
        type: "specific-element",
        label: "Correct Word Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-correct-word-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.CorrectWordItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            question: modelObject.data.question,
            word: modelObject.data.word,
            image: modelObject.data.image,
            alt: modelObject.data.alt
        }

        var template = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label>{{translate "widgets.CorrectWordItem.form.question.label"}}</label>
            <input type="text" class="form-control" name="question" autocomplete="off" placeholder="{{translate "widgets.CorrectWordItem.form.question.placeholder"}}" value="{{question}}" required/>
            <small class="form-text text-muted">{{translate "widgets.CorrectWordItem.form.question.help"}}</small>
          </div>
          <div class="form-group">
            <label for="word">{{translate "widgets.CorrectWordItem.form.word.label"}}</label>
            <input type="text" class="form-control" name="word" required autocomplete="off" placeholder="{{translate "widgets.CorrectWordItem.form.word.help"}}" value="{{word}}"/>
            <small class="form-text text-muted">{{translate "widgets.CorrectWordItem.form.question.help"}}</small>
          </div>
          <div class="form-group">
            <label for="image">{{translate "widgets.CorrectWordItem.form.image.label"}}</label>
            <input type="url" class="form-control" name="image" required autocomplete="off" placeholder="{{translate "widgets.CorrectWord.form.image.placeholder"}}" value="{{image}}"/>
            <small class="form-text text-muted">{{translate "widgets.CorrectWordItem.form.image.help"}}</small>
          </div>
          <div class="form-group">
            <label for="alt">{{translate "common.alt.label"}}</label>
            <input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/>
            <small class="form-text text-muted">{{translate "common.alt.help"}}</small>
          </div>
          {{#if image}}
          <p>{{translate "widgets.CorrectWordItem.form.preview"}}</p>
            <img class="img-fluid" src="{{image}}"/>
          {{/if}}
        </form>`;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.CorrectWordItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = (modelObject.data.question && modelObject.data.word) ? (modelObject.data.question + " -> " + modelObject.data.word) : indieauthor.strings.widgets.CorrectWordItem.prev;
    },
    emptyData: function (options) {
        return {
            data: {
                question: "",
                word: "",
                image: "",
                alt: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.question = formJson.question;
        modelObject.data.image = formJson.image;
        modelObject.data.word = formJson.word;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image)) errors.push("CorrectWordItem.image.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.question))
            errors.push("CorrectWordItem.question.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.word))
            errors.push("CorrectWordItem.word.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(formData.image))
            errors.push("CorrectWordItem.image.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.question))
            errors.push("formData.question.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.word))
            errors.push("formData.word.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAh1BMVEUAAAAeN1Z4h5oeN1Y4T2owR2MjPFp4h5oeN1YeN1Z4h5pOYXkpQV8oQF14h5ozSmZ4h5orQ2AmPlx4h5opQF54h5orQ2AeN1Z4h5oeN1Z4h5p4h5p4h5r///94h5oeN1aOm6rHzdVWaIA9Um35DVxHXHXx8vS4wMqcp7VecIeqtL+AjqBygpVTHpl4AAAAHXRSTlMAQMCA/tD3QDAQ8CDs6uDc0MymoJeQiHBgYFAwEEG2VFcAAACmSURBVEjH7c7LDoIwEIXhqhUKeL/f2hG1BdT3fz4VSkhM7LQxISz6b2bzZXLIOzZA2kekbgX0Yg7GTNsNZBxJyUD/DnKOpui2tD1QHO8x1JhbdO4InoYne3wV8c4BCxG64KUL7nvcKr59+nU7utljj//ECaQWWMoSk7lUqL1DUWEW0Dw1lj1BigqTaDECc7QQGtcJU994huJ1g0PMxglpOkzMI47kBYF000tT6KuDAAAAAElFTkSuQmCC"
}
indieauthor.widgets.CouplesContainer = {
    widgetConfig: {
        widget: "CouplesContainer",
        type: "specific-element-container",
        label: "Couples",
        allow: ["CouplesItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.CouplesContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget-couples-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.CouplesContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.CouplesContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.CouplesContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0) errors.push("CouplesContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAD80lEQVRoge2ZbUhTURjH/7tmkZYusCKIOymiNIooYhWZ9sVeFvSCzSgjwhKyL0pR24feX7bC0CAKlr1BQWlkHzKwPqSZlEkSSAvqyzaCPhTk+yf1xnPalsO7c8+dc9fCP4zdu3vuOb9z9pznec45JgyTbLUvA7ANxsoH4GmgtaYzGkUYWrbaKwGUzZ0zE/QxSu/avQiCbw+01nyMiiFb7adlq11paHqvGK2unl5l495jimy1/5KtdjMP+teth/WGA4dE4Gu2HSbwMjVeSbba8wCYC2y5BpvyX6VNS0V+7kq636r2XApdUMHxpHQOjzSuSAU1AR1vTZmcbHa4PHkOlyfCi0ziteP96sOth8/x7fsPLk7a9FTstOUif93KPz909WPQ9QRKR0CzGybbCiTtyQHSU0Y8M6dNo2D3CkCnw+UpdztL7mpCF5aeRXHhZuy05XEbpk4dPFaBlrprLDAR8OD1Bk1gpubP7CupdAOvFI30HYfL43M7Sxq50N09fSg7UCDUdm19I4MnaO4Ip6dAWmqB0tkPpcP/57eufqE2AOwDwIeOt0xyBpJbLoRNYWB3FYaefdDTSiYSPRGlLSsibFfDJKJKc6QtqwpHTxuUEvgZee//ySkdXZrQ/nePhCoqLD2jWYZMYdBVBylnEbPpAcf9sYGOt5hncY2u0n8yInJHmoJGVfVjrFqeza2EXB0l76HFg2mJHPa/QlIJLDFDP7p+kkXEt9WfuJVQ525ePhqGTnLuYN+6ImK8oLMXZOLKiVJdFTKlpyDJXaT/PUH9fzZNUt6I2aZpiSXCNinZ6u7RDs+xLKS50AO2ixgSnFAEndxynl2/eN2GI+duIHuBRfM971c/bl46qjnZh4sLLQoMNun87F8xrc1CbX0TTpXtg8i6k7wTeR490GNi05QdjuXeSUwRkbI1k2VmZHqZQOmGHpFeHvJg6EHziHKUXwd3i7h62/4Jq5cv1sWg2zxohCPSS52BIR7SPdJkEhH3UdJLWqIJTa5q/b3QD93hZyZBI0zAsaaXo1FME5FsWM2OQyLPIerGunr7uLtJauJC03JIdFUt5WQxH42gaRw8XoHK6lrN9yjZosQsftDuopgSHxrhjpe3db8nqoltsURpAjpRkoKHMkIhN5FqeN2G1JSpqi1KgdYagm48U3UP3b194wL4cX0TvF98mCfPUX0ecnnl3i++V5v2HjcX79rM1oZGiAatoamNQS+cL2NWxgxViuHniLSdSmeJeaGNPiM0O2MGA46Sjze6nSXrw8EleEK6X62kw+VRjOqEmkS9R/ST08SKcYhCl48DYLKEqxCFpiMDOqsOuUcDRO2vdztLjGp/lALwG87iVPccTNroAAAAAElFTkSuQmCC"
}
indieauthor.widgets.CouplesItem = {
    widgetConfig: {
        widget: "CouplesItem",
        type: "specific-element",
        label: "Couples Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-couple-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.CouplesItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            couples: modelObject.data.couples
        }

        var template = `
        <form id="f-{{instanceId}}">
          {{#each couples}}
          <fieldset class="couple">
            <legend class="text-center">
              {{#if @index}}
                {{translate "widgets.CouplesItem.form.legend.second"}}
              {{else}}
                {{translate "widgets.CouplesItem.form.legend.first"}}
              {{/if}}</legend>
            <fieldset class="form-group">
              <div class="row">
                <legend class="col-form-label col-sm-2 pt-0">{{translate "widgets.CouplesItem.form.type.label"}}</legend>
                <div class="col-sm-10">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="couple[{{@index}}][type]" id="couple-{{@index}}-type-text" value="text" {{#ifneq type "image"}} checked {{/ifneq}} required>
                    <label class="form-check-label" for="couple-{{@index}}-type-text">
                      {{translate "widgets.CouplesItem.form.type.text"}}
                    </label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="couple[{{@index}}][type]" id="couple-{{@index}}-type-image" value="image" {{#ifeq type "image"}} checked {{/ifeq}} required>
                    <label class="form-check-label" for="couple-{{@index}}-type-image">
                      {{translate "widgets.CouplesItem.form.type.image"}}
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
            <div class="form-group text {{#ifeq type "image"}} d-none {{/ifeq}}">
              <label for="text-{{@index}}-{{instanceId}}">{{translate "widgets.CouplesItem.form.text.label"}}</label>
              <textarea rows="5" class="form-control texteditor" id="text-{{@index}}-{{instanceId}}" name="couple[{{@index}}][text]" placeholder="{{translate "widgets.CouplesItem.form.text.placeholder"}}" {{#ifneq type "image"}} required {{/ifneq}} ></textarea>
              <small class="form-text text-muted">{{translate "widgets.CouplesItem.form.text.help"}}</small>
            </div>
            <div class="image {{#ifneq type "image"}} d-none {{/ifneq}}">
              <div class="form-group">
                <label for="image">{{translate "widgets.CouplesItem.form.image.label"}}</label>
                <input type="url" class="form-control" name="couple[{{@index}}][image]" {{#ifeq type "image"}} required {{/ifeq}} placeholder="{{translate "widgets.CouplesItem.form.image.placeholder"}}" value="{{image}}" autocomplete="off"/>
                <small class="form-text text-muted">{{translate "widgets.CouplesItem.form.image.help"}}</small>
              </div>
              <div class="form-group">
                <label for="alt">{{translate "common.alt.label"}}</label>
                <input type="text" class="form-control" name="couple[{{@index}}][alt]" {{#ifeq type "image"}} required {{/ifeq}} autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/>
                <small class="form-text text-muted">{{translate "common.alt.help"}}</small>
              </div>
              {{#if image}}
                <p>{{translate "widgets.CouplesItem.form.preview"}}</p>
                <img class="img-fluid" src="{{image}}"/>
              {{/if}}
            </div>
          </fieldset>
          {{/each}}
        </form>
        `;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.CouplesItem.label
        };
    },
    settingsClosed: function (modelObject) {
        $('#f-' + modelObject.id).off('couples');
    },
    settingsOpened: function (modelObject) {
        let $form = $('#f-' + modelObject.id);
        let $editors = $form.find('.texteditor');
        $editors.each(function (idx) {
            indieauthor.widgetFunctions.initTextEditor(modelObject.data.couples[idx].text, $(this));
        });
        $form.on('change.couples', 'input[type=radio]', function () {
            let $anchor = $(this).closest('.couple');
            $anchor.find('.text textarea').prop('required', this.value !== "image");
            $anchor.find('.text').toggleClass("d-none", this.value === "image");

            $anchor.find('.image input').prop('required', this.value === "image");
            $anchor.find('.image').toggleClass("d-none", this.value !== "image");
        });
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        let couples = modelObject.data.couples.filter(couple => ["image", "text"].includes(couple.type));
        if (couples.length === 2) {
            let html = couples.map(couple => couple.type === "image" ? `<div>${couple.image}</div>` : `<div>${couple.text}</div>`).join(' -> ');
            element.innerHTML = html
        }
        else
            element.innerHTML = indieauthor.strings.widgets.CouplesItem.prev;
    },
    emptyData: function (options) {
        var object = {
            data: {
                couples: [
                    { type: "", image: "", text: "", alt: "" },
                    { type: "", image: "", text: "", alt: ""}
                ]
            }
        };

        return object
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.couples[0].type = formJson.couple[0].type;
        modelObject.data.couples[1].type = formJson.couple[1].type;
        modelObject.data.couples[0].text = formJson.couple[0].text;
        modelObject.data.couples[1].text = formJson.couple[1].text;
        modelObject.data.couples[0].image = formJson.couple[0].image;
        modelObject.data.couples[1].image = formJson.couple[1].image;
        modelObject.data.couples[0].alt = formJson.couple[0].alt;
        modelObject.data.couples[1].alt = formJson.couple[1].alt;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        widgetInstance.data.couples.forEach(couple => {
            if (couple.type !== 'text' && couple.type !== 'image')
                errors.push("CouplesItem.type.invalid");

            if (couple.type === 'text' && indieauthor.utils.isStringEmptyOrWhitespace(couple.text))
                errors.push("CouplesItem.text.invalid");

            if (couple.type === 'image' && !indieauthor.utils.isIndieResource(couple.image))
                errors.push("CouplesItem.image.invalid");

            if (couple.type === 'image' && indieauthor.utils.isStringEmptyOrWhitespace(couple.alt))
                errors.push("common.alt.invalid")
        });

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];
        formData.couple.forEach(couple => {
            if (couple.type !== 'text' && couple.type !== 'image')
                errors.push("CouplesItem.type.invalid");

            if (couple.type === 'text' && indieauthor.utils.isStringEmptyOrWhitespace(couple.text))
                errors.push("CouplesItem.text.invalid");

            if (couple.type === 'image' && !indieauthor.utils.isIndieResource(couple.image))
                errors.push("CouplesItem.image.invalid");

            if (couple.type === 'image' && indieauthor.utils.isStringEmptyOrWhitespace(couple.alt))
                errors.push("common.alt.invalid")
        });
        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAh1BMVEUAAAAeN1Z4h5oeN1Y4T2owR2MjPFp4h5oeN1YeN1Z4h5pOYXkpQV8oQF14h5ozSmZ4h5orQ2AmPlx4h5opQF54h5orQ2AeN1Z4h5oeN1Z4h5p4h5p4h5r///94h5oeN1aOm6rHzdVWaIA9Um35DVxHXHXx8vS4wMqcp7VecIeqtL+AjqBygpVTHpl4AAAAHXRSTlMAQMCA/tD3QDAQ8CDs6uDc0MymoJeQiHBgYFAwEEG2VFcAAACmSURBVEjH7c7LDoIwEIXhqhUKeL/f2hG1BdT3fz4VSkhM7LQxISz6b2bzZXLIOzZA2kekbgX0Yg7GTNsNZBxJyUD/DnKOpui2tD1QHO8x1JhbdO4InoYne3wV8c4BCxG64KUL7nvcKr59+nU7utljj//ECaQWWMoSk7lUqL1DUWEW0Dw1lj1BigqTaDECc7QQGtcJU994huJ1g0PMxglpOkzMI47kBYF000tT6KuDAAAAAElFTkSuQmCC"
}
indieauthor.widgets.GuessWord = {
    widgetConfig: {
        widget: "GuessWord",
        type: "element",
        label: "Guess the word",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.GuessWord.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-guess-word" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.GuessWord.prev"}} </span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            question: modelValues.data.question,
            answer: modelValues.data.answer,
            attempts: modelValues.data.attempts
        };

        var template = `
            <form id="f-{{instanceId}}">
              <div class="form-group">
                <label for="instanceName">{{translate "common.name.label"}}</label>
                <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
                <small class="form-text text-muted">{{translate "common.name.help"}}</small>
              </div>
              <div class="form-group">
                <label for="help">{{translate "common.help.label"}}</label>
                <div class="input-group mb-3">
                  <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}">
                  <div class="input-group-append">
                    <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
                  </div>
                </div>
                <small class="form-text text-muted">{{translate "common.help.help"}}</small>
              </div>
              <div class="form-row">
                <div class="form-group col-12">
                  <label for="question-{{instanceId}}">{{translate "widgets.GuessWord.form.question.label"}}</label>
                  <input type="text" id="question-{{instanceId}}" class="form-control" name="question" placeholder="{{translate "widgets.GuessWord.form.question.placeholder"}}" required value="{{question}}" />
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.question.help"}}</small>
                </div>
                <div class="form-group col-12 col-lg-8">
                  <label for="answer-{{instanceId}}">{{translate "widgets.GuessWord.form.answer.label"}}</label>
                  <input type="text" id="answer-{{instanceId}}" class="form-control" name="answer" required placeholder="{{translate "widgets.GuessWord.form.answer.placeholder"}}" value="{{answer}}"/>
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.answer.help"}}</small>
                </div>
                <div class="form-group col-12 col-lg-4">
                  <label for="attempts-{{instanceId}}">{{translate "widgets.GuessWord.form.attempts.label"}}</label>
                  <input type="number" min="1" max="9" step="1" class="form-control" id="attempts-{{instanceId}}" name="attempts" value="{{attempts}}" required />
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.attempts.help"}}</small>
                </div>
              </div>
            </form>
            `;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.GuessWord.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.name && modelObject.data.question)
            element.innerHTML = modelObject.params.name + " | " + modelObject.data.question;
        else
            element.innerHTML = indieauthor.strings.widgets.GuessWord.prev;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: "",
            },
            data: {
                question: "",
                answer: "",
                attempts: 1
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formData) {
        modelObject.params.help = formData.help;
        modelObject.params.name = formData.instanceName;
        modelObject.data.question = formData.question;
        modelObject.data.answer = formData.answer;
        modelObject.data.attempts = formData.attempts;
    },
    validateModel: function (widgetInstance) {
        let errors = [];

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.question))
            errors.push("GuessWord.question.invalid")

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.answer))
            errors.push("GuessWord.answer.invalid")

        if (!this.extensions.validateAttempts(widgetInstance.data.attempts))
            errors.push("GuessWord.attempts.invalid")

        return undefined;

    },
    validateForm: function (formData, instanceId) {
        let errors = [];

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.question))
            errors.push("GuessWord.question.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.answer))
            errors.push("GuessWord.answer.invalid");

        if (!this.extensions.validateAttempts(formData.attempts))
            errors.push("GuessWord.attempts.invalid");

        return errors;
    },
    extensions: {
        validateAttempts: function (attempts) {
            const MAX_ATTEMPTS = 9;
            const MIN_ATTEMPTS = 1;
            return attempts &&
                !isNaN(parseInt(attempts)) &&
                parseInt(attempts) <= MAX_ATTEMPTS &&
                parseInt(attempts) >= MIN_ATTEMPTS;
        },
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAqFBMVEUAAAAeN1Z4h5oeN1YvRmI4T2ojPFp4h5oeN1YeN1Z4h5oeN1ZOYXkpQV8oQF14h5ozSmZ4h5omPlx4h5opQF54h5orQ2B4h5p4h5p4h5p4h5r///94h5oeN1aOm6rHzdVWaIA9Um35DVylr7vx8vQtRGHDytJpeo6WorA8Um2HlKVLX3jS191abIPh5Oi0vMdHXHW4wMqcp7WqtL+AjqBygpVhc4lGWnQBLUU7AAAAG3RSTlMAQMCA0P73QDAQ8Ggg7Org3NCmoJeQiGBQMBCao2KJAAABNklEQVRIx+3Q2VKDMBiGYVzo7r7757MqCUnYW7f7vzNJUqXUkZTxxBl9DwjMPPnJJKgb7XmajoOPzhHed4fD0cpeYkGeeDVYzR4syRsPp9bugJO/5/0Vpi26+yX4eHi7PX5gk6semLFhH3zWB+/2xRwlkU6JlNmXQkRtiHh9smbEUcNcElHME2zgaB2zlEqBmKDIFIkuHIESqVWGguoKkZgfIDd7Mo28jQvEqZJSuYl5asdDxvUiGFdtTEIhU1pKi1E6zM1889zAUgjKoN0tJIXD9A1WkEQAt1iWDeYi+XKMzHynmmwicTPJLhqyfc/efoAfTUTNW3vtNfkf/008w5z8VW8WB/sV99onvDo8GoTLeWeLF1TM4WB8eoDuwpw5/Bnz1MInXnzR4KHPTmZB0/VR9yFugnfrmMtHLpj99QAAAABJRU5ErkJggg=="
}
indieauthor.widgets.DragdropContainer = {
    widgetConfig: {
        widget: "DragdropContainer",
        type: "specific-element-container",
        label: "Drag And Drop ",
        allow: ["DragdropItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/>  <br/> <span> {{translate "widgets.DragdropContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function () {
        return '<div class="widget-dragdrop-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.DragdropContainer.label"}}</span></div><div class="b3" data-toolbar></div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.DragdropContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.DragdropContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("DragdropContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADhklEQVRoBe2Zb0gTcRjHv95m4Z90giZSnVKIf6CIIhaVqBFlFqQSs0ipCAZZLxSiNoPKXrRVLzIEy0WERJAS1huDQaBmLzIhIklNXzSvlwr+943o4rnt5s7dztPm3YR94WD3/H5397nnvvc8435R8BNrNO0FUAJt5QLwgetpnQhG4YNmjaYnAKq3p6WANq309Xs/vOClXE/rj6AYrNF0jzWa3M6ub26tNTk94y6qvOlmjaZx1mgyyEGPv3zbrjmwIAI/VHKNwKuleBnWaCoAYDh7Kl9jKy8pIT4Ox/MP0P4ZqXFG+EETw0mJMjxMWJEqVAQ61Nq8KdpgsTkKLDaHqIqENbQhIZ6aXQeAPxab45IQ3yj2oEy/oqxjA3r6IjYgdAY2avXQh+pE/cMuTE3PBcQP7ssN1SV8CoB2941gvvgBMCkG0D8zg7mQFxS4vOo+cjPTl8VH8OLhjZCDB2aaYCcDM+bmxoKehDJMwC2Nd0Xx8qq6peO/DGCxe1AWhpISxSavAXqdRMALtjZ56LxsIJygKYs8lIyidqevcBaPAqETYz3bMouQ1/kYjS1T1qdBXH8/jHLUiQbI0wlbPPP5x64gi2uCprvd9LdJDMyNYeGqA/OHb0P/3IyoIzmiePzEHDKaq1GTLL4hAs7NzAgJqCy0lChL+vZaLDQ6MX++HjqqImwK71FdVRH01lLsAPhNDa3K07qqE2D2sJ6SSPv2Cj6mtlYFTZnms2st473NVwNu1LevlhRBC951T8wh+mOt7y1nTu/3eX32cQUGU2NEx6nmaQHQX4s/R8Dk5SC6vVYUF7w+/qgNv2qa0HB0m2hcvY7IjWKxeyAgLFdDfx/LRoOrT74jUkflRmVh+GsosJl6HfFN94odkbeet5zKSb2OyHfDMvlJrLLPcdIdUUoyj41eOPKvvx3g9bQgyqBOQRbXBM13xKnXqzoJVYiWxjva/Z9eq9ajtAVT5GONWopAq6UItFpivIsywgJN2Mj5uRdxsTGSOAzX00rQnXX1zZiamQ0L5nftXegfcmEnmyY5LjSXmv4hV8fJyluGK+eKVW0U/qKkObt6eeisXSy2JidJzvNfR6TPqbSWWCB86NNCqclJPHCQtcxOu9Vc6Gvj3hXSy1IzLTaHW6ubkJLS6hF85VRd8RxKoWvCAJic8BRKoe1WcyetVQvlUQPR9QvtVrNW1/9PAfgHtKkr/F25PusAAAAASUVORK5CYII="
}
indieauthor.widgets.DragdropItem = {
    widgetConfig: {
        widget: "DragdropItem",
        type: "specific-element",
        label: "Drag And Drop Item ",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function () {
        return '<div class="widget-base widget widget-dragdrop-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img class="img-fluid drag-item" src="' + this.icon + '" /></div><div class="b2" data-prev><span>{{translate "widgets.DragdropItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id
        }

        if (!indieauthor.utils.isEmpty(modelObject.data)) {
            templateValues.term = modelObject.data.term;
            templateValues.definition = modelObject.data.definition;
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="term">{{translate "widgets.DragdropItem.form.term.label"}}</label><input type="text" class="form-control" name="term" required placeholder="{{translate "widgets.DragdropItem.form.term.placeholder"}}" value="{{term}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.DragdropItem.form.term.help"}}</small></div><div class="form-group"><label for="definition">{{translate "widgets.DragdropItem.form.definition.label"}}</label><textarea rows="4" class="form-control" name="definition"  placeholder="{{translate "widgets.DragdropItem.form.definition.placeholder"}}" required>{{definition}}</textarea><small class="form-text text-muted">{{translate "widgets.DragdropItem.form.definition.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.DragdropItem.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');

        if (modelObject.data.term && modelObject.data.definition)
            element.innerHTML = "<p><b>" + modelObject.data.term + "</b>" + "<span> -> " + modelObject.data.definition + "</span></p>";
        else
            element.innerHTML = indieauthor.strings.widgets.DragdropItem.prev;
    },
    emptyData: function (options) {
        var object = {
            data: {
                term: "",
                definition: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.term = formJson.term;
        modelObject.data.definition = formJson.definition;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.term.length == 0) errors.push("DragpdropItem.term.invalid");
        if (widgetInstance.data.term.definition == 0) errors.push("DragpdropItem.definition.invalid");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            };

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (formData.term.length == 0) errors.push("DragpdropItem.term.invalid");
        if (formData.term.definition == 0) errors.push("DragpdropItem.definition.invalid");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACrUlEQVRoge2ZT2jTUBzHv02noq21g04pSDoU/6wgiCIZoq47KG4TXGXGwRjzH7146S7a3PRie3OCp6KIB4fUgV6K9LTWKloHxYsd1IMllx0czq2rF7GRV5a62pcYsSYp5AOB9JeX9z55fby8l58N62A5/iCAYRhLCcBzMZf4qmRRl2Y5/g6A8E5vF8hhFG/zBayJB8Vc4r2iBsvxN1mOl1KZd5LRLJdXpdPj1yWW45dYjnerSS89eJI0XFiGiB8dvkbEwzRfhuX4AAD3yFCfwUP5Fy6nA6f6jpDfZ2nXGfmEFDQT21R8GFOZasSSbjWbNm5wR6LxQCQab5hFTC3tdjnJy24WwKdINH5RjrfL8CA9/ZD0OtpwTE+gDaW7Yc0eOmJJ60VbSnfQgtKr+aaY7ViPakVT92eo8cujAy1fjDVJE+Hvg7ebCtqFc7ALQWolZLfxNJnG+aFAQ5zEeg/5a0crofY0DUn8TP0HCM6iiJOME+GrIw3xN/kP9fPq4yyq01nVNuyxMdgO+P7ool06O48f4iL1mrdcQXDhi/r94iKqWfpDy9iXv2ly0SzNjJ1QHB4f8wXcmnqEF2pCQlDx/r+lWZrtAnPmMPDbUzPH9ytW7d/rw0q5Al/vhYa4a6vjv+zsm6RtrAcd09T9pCJkq/b62b2WyylhvVz0wpLWC0taLyxpvbCk9cKS1ou2lSZJGTlBYxpSL+fg2LKZLi3mEkQ6TRbxK6sVUzjPJDMoFEvYxXqp1+X19GShWJodGL/hvjI6CP+ebl0lZUinpTJzNel9u1ls93RSy63PI5LPqSSXGJA/9BnBDk9nTVhhx5OOCaH++s5lLUN6iVYyEo1LRj0EDa2zh3LmVF9qHlqlJ00gTEbCXWiVjgmhNMlVy9OjAZD2+2NCyKj2/xEAPwGP2L6VdBBYHQAAAABJRU5ErkJggg=="
}
indieauthor.widgets.GuessWord = {
    widgetConfig: {
        widget: "GuessWord",
        type: "element",
        label: "Guess the word",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.GuessWord.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-guess-word" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.GuessWord.prev"}} </span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            question: modelValues.data.question,
            answer: modelValues.data.answer,
            attempts: modelValues.data.attempts
        };

        var template = `
            <form id="f-{{instanceId}}">
              <div class="form-group">
                <label for="instanceName">{{translate "common.name.label"}}</label>
                <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
                <small class="form-text text-muted">{{translate "common.name.help"}}</small>
              </div>
              <div class="form-group">
                <label for="help">{{translate "common.help.label"}}</label>
                <div class="input-group mb-3">
                  <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}">
                  <div class="input-group-append">
                    <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
                  </div>
                </div>
                <small class="form-text text-muted">{{translate "common.help.help"}}</small>
              </div>
              <div class="form-row">
                <div class="form-group col-12">
                  <label for="question-{{instanceId}}">{{translate "widgets.GuessWord.form.question.label"}}</label>
                  <input type="text" id="question-{{instanceId}}" class="form-control" name="question" placeholder="{{translate "widgets.GuessWord.form.question.placeholder"}}" required value="{{question}}" />
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.question.help"}}</small>
                </div>
                <div class="form-group col-12 col-lg-8">
                  <label for="answer-{{instanceId}}">{{translate "widgets.GuessWord.form.answer.label"}}</label>
                  <input type="text" id="answer-{{instanceId}}" class="form-control" name="answer" required placeholder="{{translate "widgets.GuessWord.form.answer.placeholder"}}" value="{{answer}}"/>
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.answer.help"}}</small>
                </div>
                <div class="form-group col-12 col-lg-4">
                  <label for="attempts-{{instanceId}}">{{translate "widgets.GuessWord.form.attempts.label"}}</label>
                  <input type="number" min="1" max="9" step="1" class="form-control" id="attempts-{{instanceId}}" name="attempts" value="{{attempts}}" required />
                  <small class="form-text text-muted">{{translate "widgets.GuessWord.form.attempts.help"}}</small>
                </div>
              </div>
            </form>
            `;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.GuessWord.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.name && modelObject.data.question)
            element.innerHTML = modelObject.params.name + " | " + modelObject.data.question;
        else
            element.innerHTML = indieauthor.strings.widgets.GuessWord.prev;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: "",
            },
            data: {
                question: "",
                answer: "",
                attempts: 1
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formData) {
        modelObject.params.help = formData.help;
        modelObject.params.name = formData.instanceName;
        modelObject.data.question = formData.question;
        modelObject.data.answer = formData.answer;
        modelObject.data.attempts = formData.attempts;
    },
    validateModel: function (widgetInstance) {
        let errors = [];

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.question))
            errors.push("GuessWord.question.invalid")

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.answer))
            errors.push("GuessWord.answer.invalid")

        if (!this.extensions.validateAttempts(widgetInstance.data.attempts))
            errors.push("GuessWord.attempts.invalid")

        return undefined;

    },
    validateForm: function (formData, instanceId) {
        let errors = [];

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.question))
            errors.push("GuessWord.question.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.answer))
            errors.push("GuessWord.answer.invalid");

        if (!this.extensions.validateAttempts(formData.attempts))
            errors.push("GuessWord.attempts.invalid");

        return errors;
    },
    extensions: {
        validateAttempts: function (attempts) {
            const MAX_ATTEMPTS = 9;
            const MIN_ATTEMPTS = 1;
            return attempts &&
                !isNaN(parseInt(attempts)) &&
                parseInt(attempts) <= MAX_ATTEMPTS &&
                parseInt(attempts) >= MIN_ATTEMPTS;
        },
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAuCAMAAABkkgs4AAAAqFBMVEUAAAAeN1Z4h5oeN1YvRmI4T2ojPFp4h5oeN1YeN1Z4h5oeN1ZOYXkpQV8oQF14h5ozSmZ4h5omPlx4h5opQF54h5orQ2B4h5p4h5p4h5p4h5r///94h5oeN1aOm6rHzdVWaIA9Um35DVylr7vx8vQtRGHDytJpeo6WorA8Um2HlKVLX3jS191abIPh5Oi0vMdHXHW4wMqcp7WqtL+AjqBygpVhc4lGWnQBLUU7AAAAG3RSTlMAQMCA0P73QDAQ8Ggg7Org3NCmoJeQiGBQMBCao2KJAAABNklEQVRIx+3Q2VKDMBiGYVzo7r7757MqCUnYW7f7vzNJUqXUkZTxxBl9DwjMPPnJJKgb7XmajoOPzhHed4fD0cpeYkGeeDVYzR4syRsPp9bugJO/5/0Vpi26+yX4eHi7PX5gk6semLFhH3zWB+/2xRwlkU6JlNmXQkRtiHh9smbEUcNcElHME2zgaB2zlEqBmKDIFIkuHIESqVWGguoKkZgfIDd7Mo28jQvEqZJSuYl5asdDxvUiGFdtTEIhU1pKi1E6zM1889zAUgjKoN0tJIXD9A1WkEQAt1iWDeYi+XKMzHynmmwicTPJLhqyfc/efoAfTUTNW3vtNfkf/008w5z8VW8WB/sV99onvDo8GoTLeWeLF1TM4WB8eoDuwpw5/Bnz1MInXnzR4KHPTmZB0/VR9yFugnfrmMtHLpj99QAAAABJRU5ErkJggg=="
}
indieauthor.widgets.Image = {
    widgetConfig: {
        widget: "Image",
        type: "element",
        label: "Image",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span>{{translate "widgets.Image.label"}}</span> </div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-image" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> \ <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/> </div>\ <div class="b2" data-prev><span>{{translate "widgets.Image.prev"}}</span></div>\ <div class="b3" data-toolbar> </div>\ </div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        }

        if (!indieauthor.utils.isEmpty(modelValues.data)) {
            templateValues.text = modelValues.data.text;
            templateValues.image = modelValues.data.image;
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"><label for="image">{{translate "widgets.Image.form.image.label"}}</label><input type="url" class="form-control" name="image" required placeholder="{{translate "widgets.Image.form.image.placeholder"}}" value="{{image}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.Image.form.image.help"}}</small></div> <div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div> {{#if image}} <div class="form-group"><p>{{translate "widgets.Image.form.preview"}}</p><img class="img-fluid" src="{{image}}"/></div>{{/if}}<div class="form-group"><label for="text">{{translate "widgets.Image.form.caption.label"}}</label><textarea class="form-control texteditor" name="text">{{text}}</textarea><small class="form-text text-muted">{{translate "widgets.Image.form.caption.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Image.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        var editorElement = $('#f-' + modelObject.id + ' .texteditor');
        indieauthor.widgetFunctions.initTextEditor(modelObject.data.text, editorElement);
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = (modelObject.data.text && modelObject.data.image && modelObject.params.name) ? modelObject.params.name : indieauthor.strings.widgets.Image.prev;
    },
    emptyData: function () {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: "",
            },
            data: {
                text: "",
                image: "",
                alt: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.text =indieauthor.widgetFunctions.clearAndSanitizeHtml(formJson.text);
        modelObject.data.image = formJson.image;
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            keys.push("Image.image.invalid");

        if (!widgetInstance.data.text || (widgetInstance.data.text.length == 0))
            keys.push("Image.text.invalid");

        if (indieauthor.widgetFunctions.isEmptyText(widgetInstance.data.text))
            keys.push("TextBlock.text.invalid");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            keys.push("common.alt.invalid")

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (!indieauthor.utils.isIndieResource(formData.image))
            keys.push("Image.image.invalid");

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        if (!formData.text || (formData.text.length == 0))
            keys.push("Image.text.invalid");

        if (indieauthor.widgetFunctions.isEmptyText(formData.text))
            keys.push("TextBlock.text.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            keys.push("common.alt.invalid")

        return keys;
    },
    icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADXUlEQVRoge2ZXUgUURSAz467mau4K5oh1NgPJT1EQsRAZBpERQUZxEBWVC/Sz4u+xNpTELS+WQ8ZDERP/ehLQRYJgoYiWRiSUBCEOj6Jbbqpa+vO7sSZnG22vXd3dnZnRsMPFnZ+7pzv3jlz5u5eB2hgOb4aAOrBXsYB4IU41DlLs4hLsxzfBgBNmyo2AH7s4t3Hz7Asfloc6hyharAcf4vleLn77XvZboJz8/KxCzdkluNnWI73ppKeefjsle3CKii+v/46ijeRfBmW4+sAwHvmRK3NqfyX4qJCOFK7D7dPkY4z6hc8cSXhSeHDrChTnaxJ55r8dS6vzy/U+fxCQhVJKS2L3yHqfx7/4LaVeIuL8GXXCwBjPr9wSQ3tpAqPTkDk+B2AYCi+L9r+BlxPm8BxYJfVg44j/cjnF8ZbWxr7qCMtnb2bIKwQDIF0RbDAkcpFoKUHjjItFXC/PPDFBl+FLfBfVQ/H7koAj5vcwuPOOqezvVPUkXY+aCTvbz2fVUDpqqA84LHH/YavQa0ezMm94Hp9E6Lt3X8eSI8b8q4dzWqUUViVxe8YnDlXkztpBAWdOSpvWmHtPiPiljyIJGE9x2iYLq1HKlNxU6UzkcnkXNOkjdx2vW1ST5hGJ0BqILzOcxTcaFuqNL6ulXraNZw0cco2qK5rdA1Tj5OlcWKkmTCRZnxmCatgTBrxOt0zsNyzXxGIPekHGSeDNZUJzRzN94FpqAFY70q6HI6MLIpJbYwytvgDr0psnTTSsZ5PIE8Fyb2fCiodwo4lCY+KOZHVQ4K0nuD/ilstDNr0kD980x08Ll7usVwYtNKYFpmgpBAljcxmVf4ISDnLQwKxCASikmkCO10FGbdJKz0YnoOXoYBRp7QIpTsybpNWuspZAOAuNcPXMGml8fYZuYVmsvZfnlWsWmlclIGvkUX7bTSMLM1DoZv8LDHiUCdK93WEpiEkk2dVVjMY/gmTUhi2sRXEyGr1aJ6Uwr23Z0Xv4QIvbM7Lt0U2JEdhZGlBka7azkJ5WQnxPEUa1+tYjt8aiEXaOham69Q/+uxgY1kJHKzek3ItM16nl1dIL5NO8vkF2a5OkNBbPegrp9aieOiVbl4BwpgJ90CvNC4Z4Fq1Wh5tAOMfam1ptCt+lgDAb7cafqL8lCv0AAAAAElFTkSuQmCC"
}
indieauthor.widgets.ImageAndSoundContainer = {
    widgetConfig: {
        widget: "ImageAndSoundContainer",
        type: "specific-element-container",
        label: "Image and Sound",
        allow: ["ImageAndSoundItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.ImageAndSoundContainer.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-image-and-sound-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.ImageAndSoundContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.ImageAndSoundContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.ImageAndSoundContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0)
            errors.push("ImageAndSoundContainer.data.empty");


        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADlUlEQVRoBe2Zb0gTYRjAnztn4TQ3wwohLikkJxWRxCIc6pfKDLKQFZRJfxhkXzaC3IqwPx/cl7AIDAZRfShSgvqQwvrinxloUkjGFvbFjaAPBjr/fSl38bzbXZu7neftdrfCHxzvu+3u3t/ePc9zt3spiIMxW/cCQANoyyQAvAmNdM+ksuClGbO1AwDsW0s2AW5aMfzJDzHxE6GR7rGUGozZeosxW1nvwAdWa8Jz8+yRpmssY7ZOM2arUUx6+vHLHs2FOVD8YMMVFLcL+dKM2VoDAMbG+mqNQ/kvhQX5cKh6P74+LvQ5zXVwx2zCIOJDZ5WpRP5JaV3aZwgvwu/LHtKuFqq+EnJaDqc8av26XKOz3YM5N+Z22fi6nbb0UqcXIm8/yjvYFxCVNhYW4MWuDwBmnO0eh9tlewpqhgfFFENu73XQvRCsYiuB9fpJbNYzI617ZEuQy3GfhdwvHRDxfY2GknyaQZGYFhCmz1gSYzw0Bb92OUiXPlYJdJWJhBU7Hlzt6UtBSWmUpSwmEgYEgx6o3duIGBteBF3vDaAMeoj4AsAOBYANTckfSynpBOEYtKUclsaDJFHZzyE5MyuIYjHN+gJJ71FVpmgnFiq0xUTCI8d1kvQ1l44MJUvHi1F7GPIlSMhgeASzIDz4meYS0KBPiOvIc59SQykoHfpJKgS2CMpGq8iCUkPwKFryOGHSHw/CklOZxFuOpJj+/mMK3g2OkjbpBJZy2YPjryEHSTNdd64VZucWoHBDPrx//TDh3huTC692IKPu8tVllUiSRmGuxdmuKEu8Qcf6PLsxj/TV+DMhKTwunD7KtxVlpUmfz84vwKmWO2TDfqaRJN1mb4bgcBdpUwn7JybJpoZ4WheXeGEONcQlSV+920m2eISEOTItvmIiouyrngH+9b2bLaLCHNFwCcKBfRWKCsNK0suFub7/W1BUONOISscLi72nNmvPPdTi/5NO9zl1pp5ziyZiV2eb7MTDUqeJNA5qv9SYkYHTYS0R1YKOLcpwCzRZg3dwFPL1ecIzHRrpRun+2/efqXIvLAVMfrxN2M6UCO7NJaLDPzHZV9fUaryY4kZfDXDSvAOjRHrnDgY2FxcJjhq/joiPU3EtsYZ70KcFW4qLiHCKctnvdtlq+ZIXWyE9L7Sns93DavUlhJBaPVKvnKoL8ZAq7cgCYYyEByBV2u2y9eNaNVceNQDHr3W7bNr980gLAPgDFU9nVbZypqMAAAAASUVORK5CYII="
}
indieauthor.widgets.ImageAndSoundItem = {
    widgetConfig: {
        widget: "ImageAndSoundItem",
        type: "specific-element",
        label: "Image and Sound Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-image-and-sound-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.ImageAndSoundItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            audio: modelObject.data.audio,
            text: modelObject.data.text,
            image: modelObject.data.image,
            alt: modelObject.data.alt,
            captions: modelObject.data.captions
        }

        var template = '<form id="f-{{instanceId}}"> <div class="form-group"> <label>{{translate "widgets.ImageAndSoundItem.form.audio.label"}}</label> <input type="url" class="form-control" name="audio" placeholder="{{translate "widgets.ImageAndSoundItem.form.audio.placeholder"}}" value="{{audio}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "widgets.ImageAndSoundItem.form.audio.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.ImageAndSoundItem.form.text.label"}}</label> <textarea class="form-control" name="text" placeholder="{{translate "widgets.ImageAndSoundItem.form.text.placeholder"}}">{{text}}</textarea> <small class="form-text text-muted">{{translate "widgets.ImageAndSoundItem.form.text.help"}}</small> </div><div class="form-group"> <label for="image">{{translate "widgets.ImageAndSoundItem.form.image.label"}}</label><input type="url" class="form-control" name="image" required autocomplete="off" placeholder="{{translate "widgets.ImageAndText.form.image.placeholder"}}" value="{{image}}"/><small class="form-text text-muted">{{translate "widgets.ImageAndSoundItem.form.image.help"}}</small></div><div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div>{{#if image}}<p>{{translate "widgets.ImageAndSoundItem.form.preview"}}</p><img class="img-fluid" src="{{image}}"/>{{/if}}<div class="form-group"> <label for="text">{{translate "common.captions.label"}}</label><input type="url" class="form-control" name="captions" placeholder="{{translate "common.captions.placeholder"}}" value="{{{captions}}}" autocomplete="off"></input><small class="form-text text-muted">{{translate "common.captions.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.ImageAndSoundItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.text ? modelObject.data.text : indieauthor.strings.widgets.ImageAndSoundItem.prev;
    },
    emptyData: function (options) {
        return {
            data: {
                audio: "",
                image: "",
                text: "",
                alt: "",
                captions: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.audio = formJson.audio;
        modelObject.data.image = formJson.image;
        modelObject.data.text = formJson.text;
        modelObject.data.alt = formJson.alt;
        modelObject.data.captions = formJson.captions;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.audio)) errors.push("ImageAndSoundItem.audio.invalid");
        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image)) errors.push("ImageAndSoundItem.image.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.captions) && !indieauthor.utils.isIndieResource(widgetInstance.data.captions))
            errors.push("common.captions.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid")

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(formData.audio)) errors.push("ImageAndSoundItem.audio.invalid");

        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("ImageAndSoundItem.image.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(formData.captions) && !indieauthor.utils.isIndieResource(formData.captions))
            errors.push("common.captions.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid")

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADlUlEQVRoge2Zb0gTYRjAnztn4TQ3wwohLikkJxWRxCIc6pfKDLKQFZRJfxhkXzaC3IqwPx/cl7AIDAZRfShSgvqQwvrinxloUkjGFvbFjaAPBjr/fSl38bzbXZu7neftdrfCHxzvu+3u3t/ePc9zt3spiIMxW/cCQANoyyQAvAmNdM+ksuClGbO1AwDsW0s2AW5aMfzJDzHxE6GR7rGUGozZeosxW1nvwAdWa8Jz8+yRpmssY7ZOM2arUUx6+vHLHs2FOVD8YMMVFLcL+dKM2VoDAMbG+mqNQ/kvhQX5cKh6P74+LvQ5zXVwx2zCIOJDZ5WpRP5JaV3aZwgvwu/LHtKuFqq+EnJaDqc8av26XKOz3YM5N+Z22fi6nbb0UqcXIm8/yjvYFxCVNhYW4MWuDwBmnO0eh9tlewpqhgfFFENu73XQvRCsYiuB9fpJbNYzI617ZEuQy3GfhdwvHRDxfY2GknyaQZGYFhCmz1gSYzw0Bb92OUiXPlYJdJWJhBU7Hlzt6UtBSWmUpSwmEgYEgx6o3duIGBteBF3vDaAMeoj4AsAOBYANTckfSynpBOEYtKUclsaDJFHZzyE5MyuIYjHN+gJJ71FVpmgnFiq0xUTCI8d1kvQ1l44MJUvHi1F7GPIlSMhgeASzIDz4meYS0KBPiOvIc59SQykoHfpJKgS2CMpGq8iCUkPwKFryOGHSHw/CklOZxFuOpJj+/mMK3g2OkjbpBJZy2YPjryEHSTNdd64VZucWoHBDPrx//TDh3huTC692IKPu8tVllUiSRmGuxdmuKEu8Qcf6PLsxj/TV+DMhKTwunD7KtxVlpUmfz84vwKmWO2TDfqaRJN1mb4bgcBdpUwn7JybJpoZ4WheXeGEONcQlSV+920m2eISEOTItvmIiouyrngH+9b2bLaLCHNFwCcKBfRWKCsNK0suFub7/W1BUONOISscLi72nNmvPPdTi/5NO9zl1pp5ziyZiV2eb7MTDUqeJNA5qv9SYkYHTYS0R1YKOLcpwCzRZg3dwFPL1ecIzHRrpRun+2/efqXIvLAVMfrxN2M6UCO7NJaLDPzHZV9fUaryY4kZfDXDSvAOjRHrnDgY2FxcJjhq/joiPU3EtsYZ70KcFW4qLiHCKctnvdtlq+ZIXWyE9L7Sns93DavUlhJBaPVKvnKoL8ZAq7cgCYYyEByBV2u2y9eNaNVceNQDHr3W7bNr980gLAPgDFU9nVf9zP90AAAAASUVORK5CYII="
}
indieauthor.widgets.InteractiveVideo = {
    widgetConfig: {
        widget: "InteractiveVideo",
        type: "element",
        label: "Interactive Video",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var itemTemplate = '<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.InteractiveVideo.label"}}</span></div>';
        var item = {};
        item.content = indieauthor.renderTemplate(itemTemplate, this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-interactive-video" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate "widgets.InteractiveVideo.prev"}}</span></div><div class="b3" data-toolbar> </div></div';
    },
    getInputs: function (modelValues) {
        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"><label for="text">{{translate "widgets.InteractiveVideo.form.url.label"}}</label><input type="url" class="form-control" name="videourl" placeholder="{{translate "widgets.InteractiveVideo.form.url.placeholder"}}" value="{{{videourl}}}" autocomplete="off" required></input><small class="form-text text-muted">{{translate "widgets.InteractiveVideo.form.url.help"}}</small></div></form>';

        var rendered = indieauthor.renderTemplate(inputTemplate, {
            instanceId: modelValues.id,
            videourl: modelValues.data.videourl,
            instanceName: modelValues.params.name
        });

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.InteractiveVideo.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.name && modelObject.data.videourl)
            element.innerHTML = modelObject.params.name + ": " + modelObject.data.videourl;
        else
            element.innerHTML = indieauthor.strings.widgets.InteractiveVideo.prev;
    },
    emptyData: function () {
        return {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
            },
            data: {
                videourl: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.videourl = formJson.videourl;
        modelObject.params.name = formJson.instanceName;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (!indieauthor.utils.isInteractiveVideo(widgetInstance.data.videourl))
            keys.push("InteractiveVideo.videourl.invalid");

        if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (!indieauthor.utils.isInteractiveVideo(formData.videourl))
            keys.push("InteractiveVideo.videourl.invalid");

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: " data:image/png;base64,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"
}
indieauthor.widgets.ImageAndText = {
    widgetConfig: {
        widget: "ImageAndText",
        type: "element",
        label: "Image and Text",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.ImageAndText.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-imageandtext" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.ImageAndText.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            image: modelValues.data.image,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"><label for="image">{{translate "widgets.ImageAndText.form.image.label"}}</label><input type="url" class="form-control" name="image" required placeholder="{{translate "widgets.ImageAndText.form.image.placeholder"}}" value="{{image}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.ImageAndText.form.image.help"}}</small></div><div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div>{{#if image}} <div class="form-group"><p>{{translate "widgets.ImageAndText.form.preview"}}</p><img class="img-fluid" src="{{image}}"/></div>{{/if}}<div class="form-group"><label for="textblockText">{{translate "widgets.ImageAndText.form.text.label"}}</label><textarea rows="10" class="form-control texteditor" name="textblockText" required></textarea><small class="form-text text-muted">{{translate "widgets.ImageAndText.form.text.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.ImageAndText.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        var editorElement = $('#f-' + modelObject.id + ' .texteditor');
        indieauthor.widgetFunctions.initTextEditor(modelObject.data.text, editorElement);
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.ImageAndText.prev;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: {
                text: "",
                image: "",
                layout: 0,
                alt: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.text = indieauthor.widgetFunctions.clearAndSanitizeHtml(formJson.textblockText);
        modelObject.data.image = formJson.image;
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.text.length == 0) errors.push("ImageAndText.text.invalid");
        if (indieauthor.widgetFunctions.isEmptyText(widgetInstance.data.text)) errors.push("ImageAndText.text.invalid");
        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image)) errors.push("ImageAndText.image.invalid");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid")

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var errors = [];

        if (formData.textblockText.length == 0) errors.push("ImageAndText.text.invalid");
        if (indieauthor.widgetFunctions.isEmptyText(formData.textblockText)) errors.push("TextBlock.text.invalid");
        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("ImageAndText.image.invalid");

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid")

        return errors;
    },
    icon: "data:image/png;base64,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"
}
indieauthor.widgets.LatexFormula = {
    widgetConfig: {
        widget: "LatexFormula",
        type: "element",
        label: "Latex formula",
        category: "simpleElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span>{{translate "widgets.LatexFormula.label"}}</span> </div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-latexformula" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> \ <div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div>\ <div class="b2" data-prev><span>{{translate "widgets.LatexFormula.prev"}}</span></div>\ <div class="b3" data-toolbar> </div>\ </div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id
        }

        if (modelValues) {
            templateValues.formula = modelValues.data.formula;
            templateValues.caption = modelValues.data.caption;
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="formula">{{translate "widgets.LatexFormula.form.caption.label"}}</label><input type="text" class="form-control" name="caption" placeholder="{{translate "widgets.LatexFormula.form.caption.placeholder"}}" value="{{caption}}" autocomplete="off" required></input><small class="form-text text-muted">{{translate "widgets.LatexFormula.form.caption.help"}}</small></div><div class="form-group"><label for="formula">{{translate "widgets.LatexFormula.form.formula.label"}}</label><textarea cols="3" data-content="formula" class="form-control formula" name="formula" placeholder="{{translate "widgets.LatexFormula.form.formula.placeholder"}}" required>{{formula}}</textarea><small class="form-text text-muted">{{translate "widgets.LatexFormula.form.formula.help"}}</small><div class="formula-preview" data-content="formula-preview"></div></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: 'Latex Formula'
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {
        var formulaInput = document.querySelector('[data-content="formula"]');
        var formulaPreview = document.querySelector('[data-content="formula-preview"]');
        var timeout = null;

        if (!indieauthor.utils.isEmpty(modelObject.data))
            indieauthor.widgetFunctions.showFormula(modelObject.data.formula, formulaPreview);

        formulaInput.onkeyup = function (e) {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                indieauthor.widgetFunctions.showFormula(formulaInput.value, formulaPreview);
            }, 500);
        };
    },
    preview: function (modelObject) {
        var domPreview = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');

        if (modelObject.data.caption && modelObject.data.formula)
            domPreview.innerHTML = indieauthor.renderTemplate('<span>{{caption}} : {{formula}} </span>', modelObject.data);
        else
            domPreview.innerHTML = indieauthor.strings.widgets.LatexFormula.prev;

    },
    emptyData: function () {
        var object = {
            data: {
                formula: "",
                caption: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.formula = formJson.formula;
        modelObject.data.caption = formJson.caption;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.formula.length == 0) errors.push("LatexFormula.formula.invalid");
        if (widgetInstance.data.caption.length == 0) errors.push("LatexFormula.caption.invalid");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (formData.formula.length == 0) errors.push("LatexFormula.formula.invalid");
        if (formData.caption.length == 0) errors.push("LatexFormula.caption.invalid");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAEGElEQVRoge2ZXWjTUBTHT9NuYie2g6oIEkURP0ARRAri3HzROQU3kaLOISIWP17ci6Y+KcjaN+fL1KKouIEMUR+sWBDcnIJzTMTBFJ+6+SIoaP3ogzaNnNPcLJ1pe5vGpsL+ENK0N7m/e/I/56a5DtBJ9AfWAUAr2KsEANyfHO7/mo9Cgxb9gQsAcHLRwnmAm1168WocVPC2yeH+13kxRH/grOgPKPHBl4rdSn7/oTR3nFJEf+CL6A94C0F/uXY7ZjswE4JvbD2B4CeNeAXRH2gCAO+eHY02W3lKc+fUwdbGDXi8y+h3gX3AhtUkTwEeoapIOTUDbbVm1dZ4pXC0SQpHc6qIy2w/ytgE/G7pAkim/gmwPE8G76q5ONk9AYCvUjjaGQkFb0A50HL4HgE71iwGh9dtKTAp9REAfrEjjPR1KRxNRELBAdPQmaG3AB431Dw/bxmnXs6rdwDuP57+9UEAGDDlabQGRlloWGUlJ4+WgNlEzAy9o71jU8WhSeYjjSc3rLSah0vmoFU/YxLaoZKhlcnPtAlr7QGGHGjOektRttHPoIdO7+/mOiHzLAtt2s/JFCjP3mqbmclJg8a6m3kwWvSEciMt98Th975umpxo3xMv+Ro5npal3oIj1/xcZn3GfHDFzpjOCw1aaG8goEIjLxrlZArSO7poY3cNr8m+Qzs4Q20EjG0zbybAsUY0D+2KHKAyJofvUkeG0MXqs8cNIPrIavRsgrbreUTHysSnnMGmpV66Y8LO9eahsUNnaDd9lI9FDRvzzITO49u0AWK05b6hbEftm7U2GHH8zXUpWDIwTPc0dogTBiWl2pkmzPqxiaJ+xvNZGy1HMCDqYFDpo9FsgDzmng7/mlxcl49kLzwtKTPMzxweRN+C6mc6Pt6sAWLOUELHRrPenx4cDv31aIqRwqjgxdHfTvS6ekuBs9RhG4fo06AxyZnQw8Ja3cDF0l8MGU7j7NZRVNTkY37mKXc0ceiSWR9NHAwNim2izxpoBHapEZalPs3P9IDE4UNWOaYs8cjSv2V5H5jwlmJU0ctptZrwTN1UGVT/U3VA8GTK1MxXMjTKGWmnPZsoeGoqizKrwZSEFke7IDTaoebhGfI47osloT7KrIJQqbM42kX/2CKok/PhCNvWfruV+6XHDbUfrpgGNNLMG6ZKaQa6UvpvoXFRhi3QVI3iT0egzj3bGHpyuB+hB85134RvP35WBfOd2CCMv0/AUnGh4e+sTneOv0882d5x2nt4bwusXr6kopBMGLT44AhBr1gmwnxfvWE7/Toivk7FtcQm9qLPDi3w1RNwnrXMgUgouEWbEdUV0kNGLaVwVLFrEEbirR75V04rK+Lghe6sAmB0wkXghcYlA1yrZuXRBmH/WyKhoF39lykA+APNg7K3Lx9XeQAAAABJRU5ErkJggg=="
}
indieauthor.widgets.MissingWords = {
    widgetConfig: {
        widget: "MissingWords",
        type: "specific-element-container",
        label: "Missing Words",
        allow: ["MissingWordsItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.MissingWords.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-missing-words" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.MissingWords.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label for="instanceName">{{translate "common.name.label"}}</label>
            <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
            <small class="form-text text-muted">{{translate "common.name.help"}}</small>
          </div>
          <div class="form-group">
            <label for="help">{{translate "common.help.label"}}</label>
            <div class="input-group mb-3">
              <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}" />
              <div class="input-group-append">
                <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
              </div>
            </div>
            <small class="form-text text-muted">{{translate "common.help.help"}}</small>
          </div>
        </form>`;

        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.MissingWords.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.MissingWords.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0)
            errors.push("MissingWords.data.empty");


        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAe1BMVEUAAAB4h5oeN1YeN1YoQF54h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF4rQ2B4h5pEWXMeN1b///94h5oeN1ZWaID8hq1hc4n5DVz6SYT9wtbx8vSqtL+AjqBLYHiOm6r9pML7Z5n+4evj5urHzdW4wMqcp7X6KnDo+iaZAAAAE3RSTlMAQECA/jD34NBgELqmoJeIgHAwVfDHeQAAAOVJREFUSMfl1MkOgjAQgOFaAfe1m5RF3H3/JxTLICDI1ESN0f/Sy5ceOumQa7S9JSmaeQLJG+R27JxC1to+FqCpODK0xBsa3F0zvFDQDEtm0QuwyttZYB/sObDBcOo7vOrNn8CcT25YmuISjmTWDXO3hvMacAd/ut/AgYI2FljpzG61DVbMFLwTR7JaA/ahEv7fcdfTPqRQXHxC9VEsqkmmt8qkG7CsFrONgoIvHIrV5gdMxQHHicMNJiMnCpF7E7EGTKYCy0ktYDKkaYvV41IIGHI5lsFQH7M9UuT2EeuScp3WUnABOYiPkysTnZ0AAAAASUVORK5CYII="
}
indieauthor.widgets.MissingWordsItem = {
    widgetConfig: {
        widget: "MissingWordsItem",
        type: "specific-element",
        label: "Missing Words Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.MissingWordsItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            sentence: modelValues.data.sentence,
            preview: modelValues.data.sentence.replace('[blank]', '____')
        }
        var template = `
        <form id="f-{{instanceId}}">
            <div class="form-group">
              <label>{{translate "widgets.MissingWordsItem.form.sentence.label"}}</label>
              <input type="text" class="form-control" name="sentence" autocomplete="off" placeholder="{{translate "widgets.MissingWordsItem.form.sentence.placeholder"}}" required value="{{sentence}}" />
              <small class="form-text text-muted">{{translate "widgets.MissingWordsItem.form.sentence.help"}}</small>
            </div>
            <div class="form-group">
              <label>{{translate "widgets.MissingWordsItem.form.sentencePreview.label"}}</label>
              <input type="text" class="form-control" placeholder="{{translate "widgets.MissingWordsItem.form.sentencePreview.placeholder"}}" name="sentencePreview" readonly value="{{preview}}">
              <small class="form-text text-muted">{{translate "widgets.MissingWordsItem.form.sentencePreview.help"}}</small>
            </div>
            <div class="form-group">
              <button class="btn btn-block btn-indie btn-add-combination" type="button">{{translate "widgets.MissingWordsItem.form.combinations.new"}}</button>
            </div>
            <div class="combinations"></div>
        </form>`;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.MissingWordsItem.label
        };
    },
    formCombinationTemplate: function (values) {
        let template = `
        <div class="form-row combination">
            <div class="form-group col-9 col-md-10">
                <label for="combination[{{pos}}]">{{translate "widgets.MissingWordsItem.form.combinations.text"}}</label>
                <input type="text" class="form-control" id="combination[{{pos}}]" name="combination[{{pos}}]" value="{{combination}}" required />
            </div>
            <div class="form-group col-3 col-md-auto">
                <label for="delete-combination-{{pos}}">{{translate "widgets.MissingWordsItem.form.combinations.delete"}} &nbsp;</label>
                <button class="btn btn-block btn-danger btn-delete" id="delete-combination-{{pos}}"><i class="fa fa-times"></i></button>
            </div>
        </div>`
        return indieauthor.renderTemplate(template, values)
    },
    settingsClosed: function (modelObject) {
        $("#f-" + modelObject.id + " [name=question]").off('missingwords');

    },
    settingsOpened: function (modelObject) {
        let $form = $("#f-" + modelObject.id);
        let combinations = $.extend(true, [], modelObject.data.combinations);
        let $combinationsContainer = $form.find('.combinations');
        combinations.forEach((comb, idx) => $combinationsContainer.append(indieauthor.widgets.MissingWordsItem.formCombinationTemplate({ combination: comb, pos: idx })));
        $form.on('keyup.missingwords', 'input[name="sentence"]', function () {
            let sentenceText = $(this).val();
            $form.find('[name=sentencePreview]').val(sentenceText.replace('[blank]', '____'));
        });

        $form.on('click.missingwords', '.btn-delete', function (e) {
            let $combination = $(this).closest('.combination');
            let position = $form.find('.combination').index($combination);
            combinations.splice(position, 1);
            $combination.remove();
            $form.find('.combination input').each(function () {
                let $combination = $(this).closest('.combination');
                let position = $form.find('.combination').index($combination);
                let $label = $(this).parent().find('label');
                $(this).attr('name', $(this).attr('name').replace(/\[\d+\]/, "[" + position + "]"));
                $(this).attr('id', $(this).attr('id').replace(/\[\d+\]/, "[" + position + "]"));
                $label.attr('for', $label.attr('for').replace(/\[\d+\]/, "[" + position + "]"));
            });
            $form.find('.combination .btn-delete').each(function () {
                let $combination = $(this).closest('.combination');
                let position = $form.find('.combination').index($combination);
                let $label = $(this).parent().find('label');
                $(this).attr('id', $(this).attr('id').replace(/\-\d+/, "-" + position));
                $label.attr('for', $label.attr('for').replace(/\-\d+/, "-" + position));
            });
        });
        $form.on('click.missingwords', '.btn-add-combination', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $combinationsContainer.append(indieauthor.widgets.MissingWordsItem.formCombinationTemplate({ combination: "", pos: combinations.length }));
            combinations.push("");
        });

        $form.on('change.missingwords', 'input[name^="combination"]', function (e) {
            let position = $form.find('input[name^="combination"]').index($(this));
            combinations[position] = $(this).val();
        });
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.sentence ? modelObject.data.sentence : indieauthor.strings.widgets.MissingWordsItem.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                sentence: "",
                combinations: []
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.combinations = formJson.combination;
        modelObject.data.sentence = formJson.sentence;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.sentence))
            errors.push("MissingWords.sentence.empty");

        if (!this.extensions.validateQuestionBlankSpots(widgetInstance.data.sentence))
            errors.push("MissingWords.sentence.onlyOneBlank");

        if (!widgetInstance.data.combinations.length)
            errors.push("MissingWords.combinations.empty");

        widgetInstance.data.combinations.forEach(combination => {
            indieauthor.utils.isStringEmptyOrWhitespace(combination) &&
                errors.push("MissingWords.combinations.invalid");
        })

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];
        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.sentence))
            errors.push("MissingWords.sentence.empty");

        if (!this.extensions.validateQuestionBlankSpots(formData.sentence))
            errors.push("MissingWords.sentence.onlyOneBlank");

        if (!formData.combination.length)
            errors.push("MissingWords.combinations.empty");

        formData.combination.forEach(combination => {
            indieauthor.utils.isStringEmptyOrWhitespace(combination) &&
                errors.push("MissingWords.combinations.invalid");
        })
        return errors;
    },
    extensions: {
        validateQuestionBlankSpots: function (questionText) {
            if (!questionText || (questionText.length == 0))
                return false;

            var count = (questionText.match(/\[blank\]/g) || []).length;
            return (count == 1);
        }
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAdVBMVEUAAAB4h5oeN1YeN1YoQF54h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///94h5oeN1ZWaIBhc4n8hq35DVzx8vT9wtaqtL+Om6qAjqD6SYRPY3tHXHX+4evj5urHzdW4wMqcp7X6KnCKJge2AAAAEnRSTlMAQECA/jD34NBgELqmoJeAcDCW+Nc0AAAAs0lEQVRIx+3U2w6CMAyA4To3QDxvBUXAs77/I4rQCTeuI/FCDf/Nbr4sTZoUngl3a2gbB8gUTKydyVumnZ1LJC3wqtmKIG6GOGq+DEWDE+3RT+I0XPbAxsz7YKP64NE/4I3t5IG3ZO87H0zv/mM4qSs7OE+aXNj2wt+/lAEP2GLPy09Y4IXHhTQ1hqnMM+bfAg+EYYFcsrKEIRZVq/R9xhC2KcPWYog4G0KbihiroNvIWQUekq6Fpx6q0IMAAAAASUVORK5CYII="
}

indieauthor.widgets.Modal = {
    widgetConfig: {
        widget: "Modal",
        type: "simple-container",
        allow: ["element"],
        label: "Modal",
        category: "containers",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.Modal.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget-schema-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.Modal.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            text: modelObject.params.text,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"> <div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"> <label for="text">{{translate "widgets.Modal.form.text.label"}}</label> <input type="text" name="text" class="form-control" value="{{text}}" placeholder="{{translate "widgets.Modal.form.text.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "widgets.Modal.form.text.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SchemaContainer.label
        };
    },
    settingsClosed: function (modelObject) {

    },
    settingsOpened: function (modelObject) {

    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.Modal.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                text: "",
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.text = formJson.text;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("Modal.data.empty");

        if (widgetInstance.params.text.length == 0)
            keys.push("Modal.text.invalid");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0)
            return {
                element: widgetInstance.id,
                keys: keys
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.text.length == 0)
            keys.push("Modal.text.invalid");

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,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"
};
indieauthor.widgets.Puzzle = {
    widgetConfig: {
        widget: "Puzzle",
        type: "element",
        label: "Puzzle",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var itemTemplate = '<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.Puzzle.label"}}</span></div>';
        var item = {};
        item.content = indieauthor.renderTemplate(itemTemplate, this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function () {
        return '<div class="widget widget-puzzle" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate "widgets.Puzzle.prev"}}</span></div><div class="b3" data-toolbar></div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            image: modelValues.data.image,
            pieces: modelValues.data.pieces,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        };

        var template = `
            <form id="f-{{instanceId}}">
                <div class="form-group">
                    <label for="instanceName">{{translate "common.name.label"}}</label>
                    <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> 
                    <small class="form-text text-muted">{{translate "common.name.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="help">{{translate "common.help.label"}}</label>
                    <div class="input-group mb-3"> 
                        <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}">
                        <div class="input-group-append">
                            <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> 
                        </div>
                    </div>
                    <small class="form-text text-muted">{{translate "common.help.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="image">{{translate "widgets.Puzzle.form.image.label"}}</label>
                    <input type="url" class="form-control" name="image" required autocomplete="off" placeholder="{{translate "widgets.Puzzle.form.image.placeholder"}}" value="{{image}}"/>
                    <small class="form-text text-muted">{{translate "widgets.Puzzle.form.image.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="alt">{{translate "common.alt.label"}}</label>
                    <input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/>
                    <small class="form-text text-muted">{{translate "common.alt.help"}}</small>
                </div>
                <div class="pieces-wrapper d-none">
                    <div class="form-group"> 
                        <p>{{translate "widgets.Puzzle.form.image.preview"}}</p>
                        <canvas class="img-preview img-fluid"></canvas>
                    </div>
                    <div class="form-group"> 
                        <button class="btn btn-block btn-indie btn-add-piece" type="button">{{translate "widgets.Puzzle.form.pieces.new"}}</button> 
                    </div>
                    <div class="pieces"></div>
                </div>
            </form>
            `;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Puzzle.label
        }
    },
    formPieceTemplate: function (values) {
        let template = `
        <div class="form-row piece">
            <div class="form-group col-12 col-md-4">
                <label for="piece[{{pos}}][altImg]">{{translate "widgets.Puzzle.form.pieces.altImg"}}</label>
                <input type="text" class="form-control" id="piece[{{pos}}][altImg]" name="piece[{{pos}}][altImg]" value="{{altImg}}" step="any" required />
            </div>
            <div class="form-group col-12 col-md-4">
                <label for="piece[{{pos}}][altRec]">{{translate "widgets.Puzzle.form.pieces.altRec"}}</label>
                <input type="text" class="form-control" id="piece[{{pos}}][altRec]" name="piece[{{pos}}][altRec]" value="{{altRec}}" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][x]">{{translate "widgets.Puzzle.form.pieces.x"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][x]" name="piece[{{pos}}][x]" value="{{x}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][y]">{{translate "widgets.Puzzle.form.pieces.y"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][y]" name="piece[{{pos}}][y]" value="{{y}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][w]">{{translate "widgets.Puzzle.form.pieces.w"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][w]" name="piece[{{pos}}][w]" value="{{w}}" min="0" step="any" required />
            </div>
            <div class="form-group col-6 col-md-2">
                <label for="piece[{{pos}}][h]">{{translate "widgets.Puzzle.form.pieces.h"}}</label>
                <input type="number" class="form-control" id="piece[{{pos}}][h]" name="piece[{{pos}}][h]" value="{{h}}" min="0" step="any" required />
            </div>
            <div class="form-group col-12 col-md-auto">
                <label for="delete-piece-{{pos}}">{{translate "widgets.Puzzle.form.pieces.delete"}} &nbsp;</label>
                <button class="btn btn-block btn-danger btn-delete" id="delete-piece-{{pos}}"><i class="fa fa-times"></i></button>
            </div>
        </div>`
        return indieauthor.renderTemplate(template, values)
    },

    settingsClosed: function (modelObject) {
        $(`#f-${modelObject.id}`).trigger('destroyCanvas.puzzle');
        $(`#f-${modelObject.id}`).off('puzzle');
        $(window).off('puzzle');
    },
    settingsOpened: function (modelObject) {

        let $form = $('#f-' + modelObject.id);
        let $piecesContainer = $form.find('.pieces');
        let rects = $.extend(true, [], modelObject.data.pieces);
        for (let chr of ['x', 'y', 'w', 'h'])
            rects.forEach(rect => rect[chr] = parseFloat(rect[chr]))
        let canvas = $form.find('.img-preview').first().get(0);
        let onActionRect = function (e, position) {
            let rect = rects[position];
            let $group = $form.find('.piece').eq(position);
            let $inputs = $group.find('input');
            $inputs.eq(2).val(rect.x);
            $inputs.eq(3).val(rect.y);
            $inputs.eq(4).val(rect.w);
            $inputs.eq(5).val(rect.h);
        }

        let canvasHandler = indieauthor.widgets.Puzzle.canvas.handler.apply(canvas, [this]);
        rects.forEach((rect, idx) => $piecesContainer.append(indieauthor.widgets.Puzzle.formPieceTemplate({ ...rect, pos: idx })));

        $(window).on('resize.puzzle', function () {
            canvasHandler.refreshPieces(rects); 
        });

        $form.on('destroyCanvas.puzzle', function () { canvasHandler.destroy(); })
        $form.on('actionRect.puzzle', 'canvas', onActionRect); 
        $form.on('click.puzzle', '.btn-delete', function (e) {
            let $piece = $(this).closest('.piece');
            let position = $form.find('.piece').index($piece);
            rects.splice(position, 1);
            canvasHandler.refreshPieces(rects);
            $(this).closest('.piece').remove();
            $form.find('.piece input').each(function () {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let $label = $(this).parent().find('label');
                $(this).attr('name', $(this).attr('name').replace(/\[\d+\]/, "[" + position + "]"));
                $(this).attr('id', $(this).attr('id').replace(/\[\d+\]/, "[" + position + "]"));
                $label.attr('for', $label.attr('for').replace(/\[\d+\]/, "[" + position + "]"))
            })
            $form.find('.piece .btn-delete').each(function () {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let $label = $(this).parent().find('label');
                $(this).attr('id', $(this).attr('id').replace(/\-\d+/, "-" + position));
                $label.attr('for', $label.attr('for').replace(/\-\d+/, "-" + position))
            });
        });
        $form.on('click.puzzle', '.btn-add-piece', function (e) {
            e.preventDefault();
            e.stopPropagation();
            let idx = rects.length;
            let rect = { x: 10, y: 10, w: 100, h: 100 };
            rects.push(rect)
            $form.find('.pieces').append(indieauthor.widgets.Puzzle.formPieceTemplate({...rect, pos: idx }));
            canvasHandler.refreshPieces(rects);
        });
        $form.on('change.puzzle', 'input[name="image"]', function (e) {
            let tmpImage = new Image;
            tmpImage.onload = function () {
                $form.find('.pieces-wrapper').removeClass('d-none');
                let img = this;
                setTimeout(function () { canvasHandler.init(img, rects); }, 150);
            }
            $form.find('.pieces-wrapper').addClass('d-none');
            if (indieauthor.utils.isIndieResource(e.target.value))
                tmpImage.src = e.target.value;

        });

        $form.on('change.puzzle', 'input[name^="piece"]', function (e) {
            let name = $(this).attr('name');
            let matched = name.match(/\[([A-Za-z])\]$/);
            if (matched) {
                let $piece = $(this).closest('.piece');
                let position = $form.find('.piece').index($piece);
                let rect = rects[position];
                let value = $(this).val();
                rect[matched[1]] = parseFloat(value);
                canvasHandler.refreshPieces(rects);
            }
        });

        modelObject.data.image && $form.find('input[name="image"]').trigger('change.puzzle');
    },
    preview: function (modelObject) {
        let element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.Puzzle.label;
    },
    emptyData: function () {
        return {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
            },
            data: {
                image: "",
                alt: "",
                pieces: []
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
        modelObject.data.image = formJson.image;
        modelObject.data.alt = formJson.alt;
        modelObject.data.pieces = formJson.piece;

            },
    validateModel: function (widgetInstance) {
        let errors = [];
        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

                if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
             errors.push("common.alt.invalid")

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            errors.push("Puzzle.image.invalid");

                if (widgetInstance.data.pieces.length == 0)
            errors.push("Puzzle.piece.empty");

                if (widgetInstance.data.pieces.length > 1) {
            widgetInstance.data.pieces.forEach(piece => {
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altImg) && errors.push("Puzzle.piece.altImg.invalid");
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altRec) && errors.push("Puzzle.piece.altRec.invalid");
                isNaN(parseFloat(piece['x'])) && errors.push("Puzzle.piece.x.invalid");
                isNaN(parseFloat(piece['y'])) && errors.push("Puzzle.piece.y.invalid");
                isNaN(parseFloat(piece['w'])) && errors.push("Puzzle.piece.w.invalid");
                isNaN(parseFloat(piece['h'])) && errors.push("Puzzle.piece.h.invalid");
            })
        }      

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

    },
    validateForm: function (formData, instanceId) {
        let errors = [];
        indieauthor.utils.isStringEmptyOrWhitespace(formData.alt) && errors.push("common.alt.invalid");
        !indieauthor.utils.isIndieResource(formData.image) && errors.push("Puzzle.image.invalid");
        formData.instanceName.length == 0 && errors.push("common.name.invalid");
        !indieauthor.model.isUniqueName(formData.instanceName, instanceId) && errors.push("common.name.notUniqueName");
        (!formData['piece'] || !Array.isArray(formData['piece']) || formData['piece'].length == 0) && errors.push("Puzzle.piece.empty");
        if (formData['piece'] && Array.isArray(formData['piece'])) {
            formData['piece'].forEach(piece => {
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altImg) && errors.push("Puzzle.piece.altImg.invalid");
                indieauthor.utils.isStringEmptyOrWhitespace(piece.altRec) && errors.push("Puzzle.piece.altRec.invalid");
                isNaN(parseFloat(piece['x'])) && errors.push("Puzzle.piece.x.invalid");
                isNaN(parseFloat(piece['y'])) && errors.push("Puzzle.piece.y.invalid");
                isNaN(parseFloat(piece['w'])) && errors.push("Puzzle.piece.w.invalid");
                isNaN(parseFloat(piece['h'])) && errors.push("Puzzle.piece.h.invalid");
            });
        }
        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAMAAABADLOjAAABAlBMVEUAAAAeN1YeN1Z4h5oeN1YeN1Z4h5oeN1YeN1Z4h5oeN1Z4h5pOYXl4h5p4h5olPVseN1YeN1YeN1Z4h5oeN1Z4h5p4h5p4h5r////WBUt4h5oeN1aPm6vHzdVWaYA1S2f40t77X5P8+fr9tc79ob/XBUvx8/T57/L46u/35Or8lbf8j7T8faj7Z5n5GWTiBk/gBk79/Pz79/j69Pb45uz9q8b8h677TohIXXb6LnM6UGv5EV/dBU3ZBUz43+f32eO5wcr9rsmdqLX7bZ1CV3L6KG76JWzqBlL42OL6ydmrtMD8mbr8ibD8c6GAj6BygpX7WI9ic4lcboX6P336Nnf1BlbkOH6qAAAAGHRSTlMAQIC/v+9AMBDv35cg38/Pn49wYGBQMBBrtB48AAABj0lEQVRIx+3SV3eCMBgGYGrd2r2Q1CooIhS1de+67d79/3+lJJ8UQg+J3vWi7wXnPeQxhiSClUiAk+Oo8JMD1L1gB8UjNg6gkchJoR2yZw9NmBJ49xDwFiqI/DwHbS2ukfO/o/fCZxvojBQ7onUxi3ODqwbVrSUpTOleiqRu1bJK6pDSCUrLRNySvymTrlF6m9ImBo/QDaJFhs5j0IR+iXuPpRtkviyu+heuMkvniFZL+fxTiqTko4emoRDtBHRuOr72at0aalWbXt1THqydNLzaJINL/Lhy8+UAPxWP/rTeVQDYmryBFD1adljfts4Pa7SG7zPmFZjQTr/f/FBhHx0Nh7HI4tOhsxAVWX2t0RoHb9PvHYQBr4aMCSk3tJpuprhnCSupO/ekw9Ag5tB17h2cYjCoum5YlaE7RLQUq94N4FwYWiaigxfegg/WfLRP/jVfJ1F6Dd2egRaC7QIX36O3lY6EupM0M6MXNJNWWojuxxE7mXcJtBOJE1rvcnXCpcM8HEsKrpzssNdxKmyYb5RBwWFBnx50AAAAAElFTkSuQmCC",
    canvas: {
        handler: function () {
            const CORNER_RESIZE_RADIUS = 15;
            const LINE_RESIZE_MARGIN = 10;
            let currentAction;
            let currentIndex;
            let isMouseDown = false;
            let canvas = this;
            let ctx = canvas.getContext('2d');
            let img;
            let paths;
            let rects; 

            let getInteractiveAreas = function () {
                let result = {'move': [], 'e-resize': [], 'w-resize': [], 'n-resize': [], 's-resize': [],
                    'nw-resize': [], 'nwse-resize': [], 'ne-resize': [], 'nesw-resize': [] }
                let ratio = $(canvas).width() / img.width;
                for (let i = 0; i < rects.length; i++) {
                    let rect = rects[i];
                    let x = rect.x * ratio;
                    let y = rect.y * ratio;
                    let w = rect.w * ratio;
                    let h = rect.h * ratio;
                    let pathRect = new Path2D();
                    pathRect.rect(x, y, w, h);
                    result['move'].push(pathRect);
                    let pathLine = new Path2D();
                    pathLine.rect(x - LINE_RESIZE_MARGIN, y + CORNER_RESIZE_RADIUS, 2 * LINE_RESIZE_MARGIN, h - CORNER_RESIZE_RADIUS);
                    result['w-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + w - LINE_RESIZE_MARGIN, y + CORNER_RESIZE_RADIUS, LINE_RESIZE_MARGIN * 2, h - CORNER_RESIZE_RADIUS);
                    result['e-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + CORNER_RESIZE_RADIUS, y - LINE_RESIZE_MARGIN, w - CORNER_RESIZE_RADIUS,  2 * LINE_RESIZE_MARGIN);
                    result['n-resize'].push(pathLine);
                    pathLine = new Path2D();
                    pathLine.rect(x + CORNER_RESIZE_RADIUS, y + h - LINE_RESIZE_MARGIN, w - CORNER_RESIZE_RADIUS,  2 * LINE_RESIZE_MARGIN);
                    result['s-resize'].push(pathLine);
                    let pathCircles = new Path2D();
                    pathCircles.arc(x, y, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nw-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x + w, y + h, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nwse-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x + w, y, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['ne-resize'].push(pathCircles);
                    pathCircles = new Path2D();
                    pathCircles.arc(x, y + h, CORNER_RESIZE_RADIUS, 0, 2 * Math.PI);
                    result['nesw-resize'].push(pathCircles);
                }
                return result;
            }

            let draw = function () {
                let ratio = $(canvas).width() / img.width;
                let lineWidth = Math.round(2 / ratio);
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, img.width, img.width);
                ctx.drawImage(img, 0, 0);
                ctx.lineWidth = lineWidth.toString();
                ctx.beginPath();
                for (let i = 0; i < rects.length; i++) {
                    let rect = rects[i];
                    ctx.rect(rect.x, rect.y, rect.w, rect.h);
                    ctx.strokeStyle = "rgba(0,0,0,1)";
                    ctx.setLineDash([]);
                    ctx.stroke();
                    ctx.strokeStyle = "rgba(255,255,255,1)";
                    ctx.setLineDash([Math.round(5/ratio), Math.round(5/ratio)]);
                    ctx.stroke();
                }                
                ctx.closePath();
            }

            let onmousedown = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (e.buttons == 1) {
                    isMouseDown = true;
                    let x = e.offsetX;
                    let y = e.offsetY;
                    for (const [key, path] of Object.entries(paths)) {
                        let idx = path.findIndex(elem => ctx.isPointInPath(elem, x, y));
                        if (idx !== -1) {
                            currentIndex = idx;
                            currentAction = key;
                            canvas.style.cursor = key;
                            return;
                        }
                    }
                    currentAction = 'none';
                    canvas.style.cursor = 'auto';
                }
            }

            let onmousemove = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (isMouseDown && e.buttons !== 1)
                    paths = getInteractiveAreas();
                isMouseDown = e.buttons == 1;
                if (isMouseDown && currentAction !== 'none') {
                    let ratio = $(canvas).width() / img.width;
                    let rect = rects[currentIndex];
                    let sX = e.movementX / ratio;
                    let sY = e.movementY / ratio;
                    switch (currentAction) {
                        case "move":        rect['x'] += sX; rect['y'] += sY; break;
                        case "e-resize":    rect['w'] += sX; break;
                        case "w-resize":    rect['x'] += sX; rect['w'] -= sX; break;
                        case "n-resize":    rect['y'] += sY; rect['h'] -= sY; break;
                        case "s-resize":    rect['h'] += sY; break;
                        case "nw-resize":   rect['x'] += sX; rect['w'] -= sX; rect['y'] += sY; rect['h'] -= sY; break;
                        case "nwse-resize": rect['w'] += sX; rect['h'] += sY; break;
                        case "ne-resize":   rect['w'] += sX; rect['y'] += sY; rect['h'] -= sY; break;
                        case "nesw-resize": rect['x'] += sX; rect['w'] -= sX; rect['h'] += sY; break;
                    }
                    draw();

                                        const event = $.Event("actionRect");
                    $(canvas).trigger(event, [currentIndex]);
                    return;
                }
                for (const [key, path] of Object.entries(paths)) {
                    if (path.some(elem => ctx.isPointInPath(elem, e.offsetX, e.offsetY))) {
                        canvas.style.cursor = key;
                        return;
                    }
                }
                canvas.style.cursor = 'auto';
            };

            let destroy = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                rects = null;
                img = null;
                canvas.removeEventListener('mousedown', onmousedown);
                canvas.removeEventListener('mousemove', onmousemove);
            };

            let refreshPieces = function (rs) {
                rects = rs;
                paths = getInteractiveAreas(img, rects);
                draw();
            }

            let init = function (im, rs) {
                destroy();
                img = im;
                canvas.width = im.width;
                canvas.height = im.height;
                canvas.addEventListener('mousemove', onmousemove);
                canvas.addEventListener('mousedown', onmousedown);
                refreshPieces(rs);
            }
            return { init, destroy, refreshPieces }
        }
    }
}
indieauthor.widgets.SchemaContainer = {
    widgetConfig: {
        widget: "SchemaContainer",
        type: "specific-element-container",
        label: "Schema",
        allow: ["SchemaItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.SchemaContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget-schema-container" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.SchemaContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SchemaContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.SchemaContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0) keys.push(" SchemaContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0)
            return {
                element: widgetInstance.id,
                keys: keys
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAC30lEQVRogWNkQAJy5mEGDAwMAQwDCx4wMDBseHRy1QdcroA7Ws48rJ+BgaFARlKUAYQHCpw4d40B6vDARydXXcDpDDnzsAY587D/Ow+e+j/Q4OPnL/89Ysv+y5mHvZczDxPA5+j3c1dsHXAHwwDI4VYB2SCHF2BzL5OceZgDAwODQIi3/QAnZQTg4+FmcLM3BfH9sckzwRgghYMJ8ONxD9OgcimRYEg6moVSAz59+cpw7dZDnPKUFKHsbKwCFe2zQHnuQkdlGrzcptjRxc3TGXYdPI1T3sJIi2HltHqyzBbg4wFVdvsZGBg+VLTPKuyoTFvAQI3k8enzV0qNIAaAyuv50FAfcmk6noEaySPU2wGFD6qGQUkCBiyNtCm1AhkoMFDD0aBKCblikrcIJzsNEwtGy2l6gZFVueCrVKBtYhRAzXY6WY5es/UgQ3HzNJzy4VmNWMWTIrwY6gviybESBZCVPFZvPUCWZdduPSBLHzoYzYj0AmQ5mtxabkAzYkFKCEpVjQxAmRBXjYhLD6mA7CIPnwOo5ThcYDQj0guQljw+fmP4276O4f/lRziVLHnIyvDHuw2nPKOuHANTlgcDo5wI2V4kydF/Mmcx/NtyFq8acwZGhn+Hr+NWcPg62NMsW6tIsRoFkJY8Pn4j2yJkgNdTRIDRjEgvQJqjKcg8yIDJx5gi/SRlRJbpaQx/deUpS9v8XAzM0bbk6yenRmTOcqfIQmqA0YxILzBkHQ3uA2HrjA4k2HnoNAM3Fyd2Rz86uQrk6AONExaCe9iDAYA6zqD+pJKcJFbXwEqPwmu3Huz3jC0XSI7wYtBSVRgQp4MCbefB02BHqyvLMYiJCGJVhzyPCBpOBc0lOsAG+gYCiIsIgh2Mo2t2oKMyzRFeTkNnSBOxqaxon/V/oDyBDRBbeuCeOaUvALuDWEcXDgIHg1LCRAZiHd1RmQYaUgqEFY8DAED2O3ZUpg2U/RQCBgYGAKY1zxwwyX/HAAAAAElFTkSuQmCC"
}
indieauthor.widgets.SchemaItem = {
    widgetConfig: {
        widget: "SchemaItem",
        type: "specific-element",
        label: "Schema Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-schema-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.SchemaItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            alt: modelValues.data.alt
        }

        if (!indieauthor.utils.isEmpty(modelValues.data)) {
            templateValues.image = modelValues.data.image;
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="image">{{translate "widgets.SchemaItem.form.image.label"}}</label><input type="text" class="form-control" name="image" required placeholder="{{translate "widgets.SchemaItem.form.image.placeholder"}}" value="{{image}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.SchemaItem.form.image.help"}}</small></div><div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div>{{#if image}} <div class="form-group"><p>{{translate "widgets.SchemaItem.form.prev"}}</p><img class="img-fluid" src="{{image}}"/></div>{{/if}}</form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SchemaItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.image ? modelObject.data.image : indieauthor.strings.widgets.SchemaItem.prev;
    },
    emptyData: function (options) {
        var object = {
            data: {
                image: "",
                alt: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.image = formJson.image;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            errors.push("SchemaItem.image.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            errors.push("common.alt.invalid")

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (!indieauthor.utils.isIndieResource(formData.image)) errors.push("SchemaItem.image.invalid");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            errors.push("common.alt.invalid")

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACZ0lEQVRoBWNkQAJy5mEGDAwMAQwDCx4wMDBseHRy1QdcroA7Ws48rJ+BgaFARlKUAYQHCpw4d40B6vDARydXXcDpDDnzsAY587D/Ow+e+j/Q4OPnL/89Ysv+y5mHvZczDxPA5+j3c1dsHXAHwwDI4VYB2SCHF2BzL5OceZgDAwODQIi3/QAnZQTg4+FmcLM3BfH9sckzwRgghYMJ8ONxD9OgcimRYNTR1AbsbKwCFe2zHCraZ6GUIoPa0QJ8PKDKbj8DA8P9ivZZCTDxoZI8QCE9HxTqDEMwTcczUNvRoCo4PKuRmkaiAwWG0dKDjmDU0fQCQ9LRLKQo/rf0MMO/ZYdxyqt+/spQ9fw1wx/vNtyG8HMxsExPA9PkApIc/SdzFl55XgYGBk2Q515ex6vur+5OBubKQLIdPZqm6QWGv6MZdeWpYimjrhxF+knKiKxHWxj+H8Gdya7eesiwZusBhvrCeNyGyIkyMMqJkORIdECSo0GA0UYTp9wXrv8M189w4lVDDTCaEekFRh1NL0BVR4MGLkO9HWjudKo7mh7Da6PJg15g1NH0AqOOphdggk7KwCZoBg3Yeeg0AzcXJ/aQfnRyFcjRBxonLGT49OXroHDzmq0HGa7desCgJCeJVR7WNC28duvBfs/YcoHkCC8GLVUFujoSBkCBtvPgabCj1ZXlGMREBLGqQ55HBA2nguYSHWADfQMBxEUEwQ7GMZd5oKMyzRHeCYDOkCZiU1nRPuv/QHkCGyC29MA9c0pfAHYHsY4uHAQOBqWEiQzEOrqjMu0AaK4aVjwOAADZ79hRmTZQ9lMIGBgYAGcFnkaUo+5mAAAAAElFTkSuQmCC"
}
indieauthor.widgets.SentenceOrderContainer = {
    widgetConfig: {
        widget: "SentenceOrderContainer",
        type: "specific-element-container",
        label: "Sentence Order",
        allow: ["SentenceOrderItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.SentenceOrderContainer.label"}}</span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function (options) {
        return '<div class="widget-sentence-order" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.SentenceOrderContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = `
        <form id="f-{{instanceId}}">
          <div class="form-group">
            <label for="instanceName">{{translate "common.name.label"}}</label>
            <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
            <small class="form-text text-muted">{{translate "common.name.help"}}</small>
          </div>
          <div class="form-group">
            <label for="help">{{translate "common.help.label"}}</label>
            <div class="input-group mb-3">
              <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}" />
              <div class="input-group-append">
                <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button>
              </div>
            </div>
            <small class="form-text text-muted">{{translate "common.help.help"}}</small>
          </div>
        </form>`;

        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SentenceOrderContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.SentenceOrderContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.length == 0)
            errors.push("SentenceOrderContainer.data.empty");


        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAllBMVEUAAAB4h5oeN1YeN1Z4h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///94h5oeN1b8hq39wtb6SYRWaIBhc4nx8vQqQmD5DVxygpX+4ev6KnCOm6r+0eD6OnpHXHXHzdW4wMqcp7WAjqDV2d9kdYo5T2uwucP/8PX9pML7Z5lPY3v5G2YnP13j5uqOsgN3AAAAEXRSTlMAQECAMPfg0GAQuqagl4BwMDhYLxIAAAEwSURBVEjHzdPtboIwFIDhykDnvg+HVltRNlBU9uXu/+aGtOSIZBwdifH9RZqHppRW7PO6exHUTYBMwW1t781KQ2c/OTrt4RLYkmBsF5ECn0bP4gmc0EWwjFwfENXN59L12sSRsuBTwczZhYwWqupN7fF0+FTjCKpkicGmJA1WOAwfzsGhfw4eWEzLmynbN635CB98uKx7p8EGbrVqPrTxhF6KMYeqHGMWa2NP4hKNZjFkaNYAa4MZ8BgSTLVOMQEG2zYYx7iB07DeIm41i10FYgF9ZubX3H83+H3m/2Dfs9FM06lrzczfbsL87SbM38F/4mu+3ccRToFPO+xhxuNkF1dY3JlCM/Mm+BVaLB6Ra1dah8XYK3ue/l0JHXb5IRthMeLsUFD+iLG+OGzQWQl+AeD7iqUwHFqjAAAAAElFTkSuQmCC"
}
indieauthor.widgets.SentenceOrderItem = {
    widgetConfig: {
        widget: "SentenceOrderItem",
        type: "specific-element",
        label: "Sentence Order Item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.SentenceOrderItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
        }
        var template = `
        <form id="f-{{instanceId}}">
            <fieldset>
              <legend class="text-center">{{translate "widgets.SentenceOrderItem.form.words.legend"}}</legend>
              <div class="form-row">
                <button class="btn btn-block btn-indie btn-add-word" type="button">{{translate "widgets.SentenceOrderItem.form.words.new"}}</button>
                <small class="form-text text-muted mb-4">{{translate "widgets.SentenceOrderItem.form.words.help"}}</small>
              </div>
              <div class="form-row words">
              </div>
            </fieldset>
            <fieldset class="answers">
              <legend class="text-center">{{translate "widgets.SentenceOrderItem.form.answers.legend"}}</legend>
              <div class="form-row">
                <button class="btn btn-block btn-indie btn-add-answer" type="button">{{translate "widgets.SentenceOrderItem.form.answers.new"}}</button>
                <small class="form-text text-muted mb-4">{{translate "widgets.SentenceOrderItem.form.words.help"}}</small>
              </div>
              <div class
            </fieldset>
        </form>`;
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SentenceOrderItem.label
        };
    },
    formAnswerTemplate: function (values) {
        let template = `
        <div class="form-row answer">
            <div class="form-group col-9 col-md-10">
                <label for="answer[{{pos}}]">{{translate "widgets.SentenceOrderItem.form.answers.text"}}</label>
                <input type="text" class="form-control" id="answer[{{pos}}]" name="answer[{{pos}}]" value="{{answer}}" required />
            </div>
            <div class="form-group col-3 col-md-auto">
                <label for="delete-answer-{{pos}}">{{translate "widgets.SentenceOrderItem.form.answers.delete"}} &nbsp;</label>
                <button class="btn btn-block btn-danger btn-delete" id="delete-answer-{{pos}}"><i class="fa fa-times"></i></button>
            </div>
        </div>`
        return indieauthor.renderTemplate(template, values)
    },
    formWordTemplate: function (values) {
        let template = `
        <div class="form-group col-12 col-sm-6 col-lg-4 word">
            <div class="form-row">
                <div class="col-9">
                    <label for="word[{{pos}}]">{{translate "widgets.SentenceOrderItem.form.words.text"}}</label>
                    <input type="text" class="form-control" id="word[{{pos}}]" name="word[{{pos}}]" value="{{word}}" required />
                </div>
                <div class="col-3">
                    <label for="delete-word-{{pos}}">{{translate "widgets.SentenceOrderItem.form.words.delete"}} &nbsp;</label>
                    <button class="btn btn-block btn-danger btn-delete" id="delete-word-{{pos}}"><i class="fa fa-times"></i></button>
                </div>
            </div>
        </div>`
        return indieauthor.renderTemplate(template, values)
    },
    settingsClosed: function (modelObject) {
        $("#f-" + modelObject.id + " [name=question]").off('missingwords');

    },
    settingsOpened: function (modelObject) {
        let $form = $("#f-" + modelObject.id);
        let answers = $.extend(true, [], modelObject.data.answers);
        let words = $.extend(true, [], modelObject.data.words);
        let $answersContainer = $form.find('.answers');
        let $wordsContainer = $form.find('.words');

                answers.forEach((ans, idx) => $answersContainer.append(indieauthor.widgets.SentenceOrderItem.formAnswerTemplate({ answer: ans, pos: idx })));
        words.forEach((wrd, idx) => $wordsContainer.append(indieauthor.widgets.SentenceOrderItem.formWordTemplate({ word: wrd, pos: idx })));
        $form.on('click.sentenceorder', '.btn-delete', function (e) {
            let $anchor = $(this).closest('.word, .answer');
            let cls = $anchor.hasClass('answer') ? '.answer' : '.word';
            let position = $form.find(cls).index($anchor);
            $anchor.remove();
            cls === '.answer' ? answers.splice(position, 1) : words.splice(position, 1);
            $form.find(cls + ' input').each(function () {
                let $item = $(this).closest(cls);
                let position = $form.find(cls).index($item);
                let $label = $(this).parent().find('label');
                $(this).attr('name', $(this).attr('name').replace(/\[\d+\]/, "[" + position + "]"));
                $(this).attr('id', $(this).attr('id').replace(/\[\d+\]/, "[" + position + "]"));
                $label.attr('for', $label.attr('for').replace(/\[\d+\]/, "[" + position + "]"));
            });

                        $form.find(cls + ' .btn-delete').each(function () {
                let $item = $(this).closest(cls);
                let position = $form.find(cls).index($item);
                let $label = $(this).parent().find('label');
                $(this).attr('id', $(this).attr('id').replace(/\-\d+/, "-" + position));
                $label.attr('for', $label.attr('for').replace(/\-\d+/, "-" + position));
            });
        });
        $form.on('click.sentenceorder', '.btn-add-word', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $wordsContainer.append(indieauthor.widgets.SentenceOrderItem.formWordTemplate({ word: "", pos: words.length }));
            words.push("")
        });

        $form.on('change.sentenceorder', 'input[name^="word"]', function (e) {
            let position = $form.find('input[name^="word"]').index($(this));
            words[position] = $(this).val();
        });

        $form.on('click.sentenceorder', '.btn-add-answer', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $answersContainer.append(indieauthor.widgets.SentenceOrderItem.formAnswerTemplate({ answer: "", pos: answers.length }));
            answers.push("")
        });

        $form.on('change.sentenceorder', 'input[name^="answer"]', function (e) {
            let position = $form.find('input[name^="answer"]').index($(this));
            answers[position] = $(this).val();
        });

    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.answers.length ? modelObject.data.answers[0] : indieauthor.strings.widgets.SentenceOrderItem.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                answers: [],
                words: []
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.answers = formJson.answer;
        modelObject.data.words = formJson.word;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!widgetInstance.data.words.length)
            errors.push("SentenceOrderItem.words.empty");

        widgetInstance.data.words.forEach(word => {
            indieauthor.utils.isStringEmptyOrWhitespace(word) &&
                errors.push("SentenceOrderItem.words.invalid");
        });

                if (!widgetInstance.data.answers.length)
            errors.push("SentenceOrderItem.answers.empty");

        widgetInstance.data.answers.forEach(answer => {
            indieauthor.utils.isStringEmptyOrWhitespace(answer) &&
                errors.push("SentenceOrderItem.answers.invalid");
        });

        if (widgetInstance.data.answers.length && widgetInstance.data.words.length) {
            if (!this.extensions.validateAnswersWithWords(widgetInstance.data.answers, widgetInstance.data.words))
                errors.push("SentenceOrderItem.answers.impossible");
        }

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (!formData.word.length)
            errors.push("SentenceOrderItem.words.empty");

        formData.word.forEach(word => {
            indieauthor.utils.isStringEmptyOrWhitespace(word) &&
                errors.push("SentenceOrderItem.words.invalid");
        })

        if (!formData.answer.length)
            errors.push("SentenceOrderItem.words.empty");

        formData.answer.forEach(answer => {
            indieauthor.utils.isStringEmptyOrWhitespace(answer) &&
                errors.push("SentenceOrderItem.answers.invalid");
        })

        if (formData.answer.length && formData.word.length) {
            if (!this.extensions.validateAnswersWithWords(formData.answer, formData.word))
                errors.push("SentenceOrderItem.answers.impossible");
        }

        return errors;
    },
    extensions: {
        validateAnswersWithWords: function (answers, words) {
            if (!answers.length || !words.length)
                return false;

                        return answers.every(answer => {
                let tokens = answer.split(/\s+/);
                let myWords = [...words];
                for (let token of tokens) {
                    let idx = myWords.indexOf(token);
                    if (idx === -1) return false;
                    myWords.splice(idx, 1);
                }
                return true;
            });
        }
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAllBMVEUAAAB4h5oeN1YeN1Z4h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///94h5oeN1b8hq39wtb6SYRWaIBhc4nx8vQqQmD5DVxygpX+4ev6KnCOm6r+0eD6OnpHXHXHzdW4wMqcp7WAjqDV2d9kdYo5T2uwucP/8PX9pML7Z5lPY3v5G2YnP13j5uqOsgN3AAAAEXRSTlMAQECAMPfg0GAQuqagl4BwMDhYLxIAAAEwSURBVEjHzdPtboIwFIDhykDnvg+HVltRNlBU9uXu/+aGtOSIZBwdifH9RZqHppRW7PO6exHUTYBMwW1t781KQ2c/OTrt4RLYkmBsF5ECn0bP4gmc0EWwjFwfENXN59L12sSRsuBTwczZhYwWqupN7fF0+FTjCKpkicGmJA1WOAwfzsGhfw4eWEzLmynbN635CB98uKx7p8EGbrVqPrTxhF6KMYeqHGMWa2NP4hKNZjFkaNYAa4MZ8BgSTLVOMQEG2zYYx7iB07DeIm41i10FYgF9ZubX3H83+H3m/2Dfs9FM06lrzczfbsL87SbM38F/4mu+3ccRToFPO+xhxuNkF1dY3JlCM/Mm+BVaLB6Ra1dah8XYK3ue/l0JHXb5IRthMeLsUFD+iLG+OGzQWQl+AeD7iqUwHFqjAAAAAElFTkSuQmCC"
}

indieauthor.widgets.SimpleImage = {
    widgetConfig: {
        widget: "SimpleImage",
        type: "element",
        label: "Simple image",
        category: "simpleElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span>{{translate "widgets.SimpleImage.label"}}</span> </div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-simple-image" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> \ <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/> </div>\ <div class="b2" data-prev><span>{{translate "widgets.SimpleImage.prev"}}</span></div>\ <div class="b3" data-toolbar> </div>\ </div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            image: modelObject.data.image,
            alt: modelObject.data.alt
        }

        var inputTemplate = '<form id="f-{{instanceId}}"> <div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="type">{{translate "widgets.SimpleImage.form.aspect.label"}}</label> <select name="aspect" class="form-control" required> <option value="original">{{translate "widgets.SimpleImage.form.aspect.values.original"}}</option> <option value="fit">{{translate "widgets.SimpleImage.form.aspect.values.fit"}}</option> </select> <small class="form-text text-muted">{{translate "widgets.SimpleImage.form.aspect.help"}}</small> </div><div class="form-group"><label for="image">{{translate "widgets.SimpleImage.form.image.label"}}</label><input type="url" class="form-control" name="image" required placeholder="{{translate "widgets.SimpleImage.form.image.placeholder"}}" value="{{image}}" autocomplete="off"/><small class="form-text text-muted">{{translate "widgets.SimpleImage.form.image.help"}}</small></div><div class="form-group"><label for="alt">{{translate "common.alt.label"}}</label><input type="text" class="form-control" name="alt" required autocomplete="off" placeholder="{{translate "common.alt.placeholder"}}" value="{{alt}}"/><small class="form-text text-muted">{{translate "common.alt.help"}}</small></div>{{#if image}}<div class="form-group"> <p>{{translate "widgets.SimpleImage.form.preview"}}</p><img class="img-fluid" src="{{image}}"/> </div>{{/if}}</form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SimpleImage.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        $("#modal-settings [name='aspect']").val(modelObject.params.aspect);
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        if (modelObject.params.name && modelObject.data.image)
            element.innerHTML = modelObject.params.name + ": " + modelObject.data.image;
        else
            element.innerHTML = indieauthor.strings.widgets.SimpleImage.prev;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                aspect: "original",
            },
            data: {
                image: "",
                alt: ""
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.image = formJson.image;
        modelObject.params.name = formJson.instanceName;
        modelObject.params.aspect = formJson.aspect;
        modelObject.data.alt = formJson.alt;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (!indieauthor.utils.isIndieResource(widgetInstance.data.image))
            keys.push("SimpleImage.image.invalid");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.alt))
            keys.push("common.alt.invalid")

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (!indieauthor.utils.isIndieResource(formData.image))
            keys.push("SimpleImage.image.invalid");

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        if (indieauthor.utils.isStringEmptyOrWhitespace(formData.alt))
            keys.push("common.alt.invalid")

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAC80lEQVRoBe2ZS2gTURSG/0wTrWltUqjWgoy1XUgXiiAyIGrrRkVFK8iAL6yb4GOTbmTqyk1NdtVNhQFxU1GyUBdVLC5a0YURKoWCWdoG3Ck1VgLSJCNn7MQ0uTedvO4EyQ8DM/cx58vJufee5LiQI1lR9wIYhLNaAPAiHo384FFkoWVFHQMQ3N61BXQ5pQ+fPmMV/Gw8GpnjYsiKekdWVGPq7UfDaSWWfxnHL98yZEVdkhXVXwx66eHTl44DWyLwA4M3CTzI4pVkRR0A4D93st/hUP6nttYWHO3fT89nWP2SdUMD60m+IjxSXZHaVAO62tq4wePXQvqAFtLX7CJFoY34N6RDz7MXPYuUv62VDrtpAF+0kD5kmXZzgecXsXLiLpBIZtvS46/heRKE62CfaKeTpx9pIX0hPBKY4Xo6df7eGmBTiSRS13QBjFxdAS88yMu8UKB2433MAV5T3fivdg/X7h2Az8ue4fNWHNOVflNcT7sfBNjt4UsVGUxd180Fnnn8rux3cHcP6dQ+eF7dRnp86u+C9HnRdONYRV4mYAuW7sm4dPFQ9aBJBOiu0vaWC5zbVg64kIXIArbTx1PNoe1AlQpeU+hSYEoZWzPocr52u3OKJ0zzi0hdYBznVTJe7lwuNB3X5n46OVuQOFVq1NY7Jme5/WxoSoxyEiZWxlcrYEtkk6dC6ETSBMyftB54NYHXUwF0SpvgfkoeuEhg5EPbMZ4PLhoYucc45Rh2jVvgrj2ycGCsgdYmSppo/lAoslhqqcZfCKLUgBalBrQoNaBFSVotyiDaYtQV2JvNGbR4NzH7pHg0QtAzo50p/GwSzsbUM38GsWYDPXIXs986xodjzcb06Z4V/9B3CX2/nYmaZckwPUzQu3plbO1oZ44zoaleJyvqzq8eY2x0W3oASHeLBrbU2dGOw71y0VpmNmFarZBeZQ3SQnpdBbzdOOBXTsVqrhTo4ToApki4D7vQVDKgWrW1PTogsn8kPBJwyn6FAvAHxnVfJg4KZGkAAAAASUVORK5CYII=",
}
indieauthor.widgets.TabContent = {
    widgetConfig: {
        widget: "TabContent",
        type: "element-container",
        label: "Tab content",
        allow: ["element", "layout", "specific-element-container"],
        category: "containers",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function () {
        return '<div class="widget-tab-content" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"> <div class="widget"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.TabContent.label"}}</span></div><div class="b3" data-toolbar></div></div><div data-role="container" data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container"></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id
        }

        if (!indieauthor.utils.isEmpty(modelObject.params)) templateValues.name = modelObject.params.name;

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="name">{{translate "widgets.TabContent.form.name.label"}}</label><input type="text" class="form-control" name="name" required placeholder="{{translate "widgets.TabContent.form.name.placeholder"}}" value="{{name}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.TabContent.form.name.help"}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TabContent.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = indieauthor.strings.widgets.TabContent.label + ": " + (modelObject.params.name ? modelObject.params.name : "");
    },
    emptyData: function () {
        var object = {
            params: {
                name: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.name;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.hasNameInParams(widgetInstance)) errors.push("TabContent.name.invalid");
        if (widgetInstance.data.length == 0) errors.push("TabContent.data.empty");

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        if (formData.name.length == 0)
            return ["TabContent.name.invalid"]

        return [];
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACrUlEQVRoBe2ZT2jTUBzHv0mnYjfaDjplIK9DEf/ARBAJiHXdRXQKbiJBrEWG0IuX9qLtTS82N+elQkFUcEOKBw8OzGmt9WAdiiB0sFPtVWGrzh3UNvKypU5J0rTpkg7ygUDLey/vk5eXX/Lej8EGCMcfBTAOeykDeFEpZpe1LBrShOPvAYjtGRwAPezi7YcS1sUnKsXsR00NwvG3CcdLYv6dZDfV7yvSmchNiXD8EuF4n5700sNns7YLK1DxE+M3qHhMzZclHB8C4Lt0bsTmqfwXT18vTo8cp/8vqJWzyg9asZvw6viwXWVqEEe60+zYvs2XSGVCiVTmnyjSY7afWuIppE8VzXKXEAYzHGjr3D5PH33ZzQFYTqQycSEZfQyzI11Li6hNF8CcPKR6wOvGr7G7Zrpo+AN4REcdpke6ugr2SACu5IRqsfRmAfWX70118R/XAOS22oM4BCd6WIjunK5PFyBVvmqW19KvwJ4/pn0Csva1+PvKlG4EYcNBMMRv+Kr1pWcKkD5/ARNQ/1R1hYNwJS9qtqciPTMx1B+I8kOp2kdhAWzwINApacijcEozOhiB3gm9u/HTE2n9nG3b2IgjbRWOtFU40lbhSFuFI20VjrRVNJeu/tg8lepqW810P02ZYbK24k6L7Wo1x+tuLBY6Iu0SruqvTDoBGWhp1dJUmiLvX3QZTvSwii0rTZMySoKmaxBfz6PXvVNdulLMUuncnakn+LayiTG5BZ7P5lFaLGMvGVRtpESPeGmxPHc2cst3/fIYDu8fskWWDpqYn5elD+wj2OXvV623MY9It1NpLjGkbPTZwW5/vyyskcvMCcnoaCNOr2dIJ9VqJlIZya6LUMNo9NDOnFqL7GFUOt4FwnQm3IdRaSEZzdFctRIebYD2Pyoko3b1bxIAfwCqj7mPjyjv0wAAAABJRU5ErkJggg=="
}
indieauthor.widgets.TabsContainer = {
    widgetConfig: {
        widget: "TabsContainer",
        type: "specific-container",
        label: "Tabs menu",
        allow: ["TabContent"],
        category: "containers",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.TabsContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });

        return element;
    },
    template: function () {
        return '<div class="widget-tabs-container widget-base" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/> </div><div class="b2" data-prev><span>{{translate "widgets.TabsContainer.label"}}</span></div><div class="b3" data-toolbar> </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="nested-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TabsContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.TabsContainer.label;
    },
    emptyData: function (widget) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("TabsContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAAC5klEQVRoge2ZTWgTQRiG302qYpOmKaRKQadVEbVQEaWuiNr0oMQq2IqsQmzFCjnUS3rR5FR7MblVLxWCv6BFowcVC+bUVD0Yg0EoRMxB0pyVNrZGUdKViU2tOrv5abKbwj6wkDAzO8/+5N3sfBwWQXhhB4BOqEscwONEyD8tZbEgTXhhCIBzXUM96KYWryNRzIt3JUL+d5IahBcuEV4QA+NvRLVJzsyKtu4LIuGFKcILZjnpqRv3R1UXzkLF93aep+JOlq+O8IIVgPnEkTaVb+U/mIwGHGprpd+Psdp12Q+0YyVRK+OjqyjTPNGkS82qlSvMLo/P6vL4/kqRqlzzzOfmf5hqqtG8uQlp112IEwnJ8XqvHTMbLIjGJpntcs8Fs8lIH3ZjAKZdHl+/1+24nVOaCp/sG5Rs/9jTi/S9l9D32Zjt4sQkfnZcxs2Bgxi6/pDZZ8/OZjwYHpDTyPgDuOXy+OJetyOY80zLkkxBt70RencXW/rVe8w9e7ukKf7hDIDgcvshNkFLDwWRvae3hhMYWd/CbDPVGJAefg7d0V3SOyC/U6HnyQe0Su3nuwFi4hM4Ysn7qGWljU8j2D35GVwjI5JS38DZ90PvPi45nopUjThhuhYAn+KYfeYCEaDXBpRKmqKzH5BMh3ygV0LuavwwdRe+z6JtVESTVgpNWik0aaXQpJVCk1YKTVopcksnv5ZPJZkqapjsX1OuhSA9HMhsZaO2euFloSTSeu9p+TeTUkDqC3prySlN4fZtK690EWjpoRTLVpoWZSQXGtUi8CIMQ/VqtnQi5KfSwcErd/BltoyZXACPRscRjcWxkTQwB2XToz8ai48d7r5oPneqI7OEqwb0pAXGwxnpLZsI1ljqmBaL64h0OZXWEq3ZhT41WGupywhLrFkHvW5H+0JOz1dIz7J6ujw+Ua2DYJFvekhXTpUl45GvdH8FCNM74SrylaYlA1qrzsajCtD5271uh1rzLxEAvwBy0swa2Lf+uwAAAABJRU5ErkJggg=="
}
indieauthor.widgets.TermClassification = {
    widgetConfig: {
        widget: "TermClassification",
        type: "specific-element-container",
        label: "Terms and Classification",
        allow: ["TermClassificationItem"],
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate(`<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="${this.icon}" class="img-fluid"/> <br/> <span> {{translate "widgets.TermClassification.label"}}</span></div>`, this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function () {
        return '<div class="widget-TermClassification" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="widget"><div class="b1"> <img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.TermClassification.prev"}}</span></div><div class="b3" data-toolbar> </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            image: modelValues.data.image,
            instanceName: modelValues.params.name,
            help: modelValues.params.help,
            alt: modelValues.data.alt
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small> </div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div><div class="form-group"><label for="image">{{translate "widgets.TermClassification.form.image.label"}}</label></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TermClassification.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.TermClassification.prev;
    },
    emptyData: function (options) {
        return {
            params: {
                name: `${this.widgetConfig.label}-${indieauthor.utils.generate_uuid()}`,
                help: ""
            },
            data: []
        };

    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            errors.push("common.name.notUniqueName");

        const duplicatedcolumns = this.functions.getDuplicatedColumn(widgetInstance.data);
        if (duplicatedcolumns.length > 0) errors.push("TermClassification.data.duplicatedColumn")

                const duplicatedTermsBetweenColumns = this.functions.getDuplicatedTerms(widgetInstance.data);
        if (duplicatedTermsBetweenColumns.length > 0) errors.push("TermClassification.data.duplicatedTerms")

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var errors = [];

        if (formData.instanceName.length == 0)
            errors.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            errors.push("common.name.notUniqueName");

        return errors;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAnFBMVEUAAAB4h5oeN1YeN1YoQF54h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///8eN1Z4h5qOm6pWaIBhc4nHzdX5DVz6KnDx8vTj5ur8hq39wtb9pMKqtL/8dqP7Z5lygpU5T2v3GGQ0Mlf/8PX+4ev+0eD6SYRPY3tHXHW4wMqcp7WAjqD7WI7UJ2iTKF5HL1d5YSg4AAAAEnRSTlMAQECA/jD34NBgELqmoJeAcDCW+Nc0AAABIElEQVRIx83U23KCMBCA4ZgCWnvOJoBBQLB46rl9/3drgGiQTtm90fG/ysU3TFhCWB0f7om5rgJACq739tZ7T8Rg8w+wmsObQFPBtN3Eq8BLgLc4FITOjNWh7voIz+Mmg0HZoLeOxg8Wq+fQBDUWNuitIynvLFbChGHpH+HZn9IuHpGf7LDbM47dNHC87wR4ETbRsFrGJqDg/pzTA84txue8/tZ6Q9vGqqi+MtoLbstZuaWNLttVxYo251zrdD0wjVg11VtNtc6R0YXtD7Epql1GnfNn+YN8FOQ8n/Pw41eBw/gl4zDaxWHSzW8xhxjHyls2mN14iwR5roIX2WJ2D1iesRazKTc9Rv9noMU2X6I5zCaYHTOXP0Gsz7qNBjPgFwmdi7gk6W/UAAAAAElFTkSuQmCC",
    functions: {
        getDuplicatedColumn: function (items) {
            if (items && items.length > 0) {
                const repeatedColumns = items.map(item => item.data.column).filter((item, pos, self) => self.indexOf(item) !== pos);
                const uniqueColumnsSet = new Set(repeatedColumns);
                return Array.from(uniqueColumnsSet);
            }

            return [];
        },
        getDuplicatedTerms: function (items) {
            if (items && items.length > 0) {
                const allTerms = items.reduce((prev, curr) => prev.concat(curr.data.terms), []);
                const duplicatedTerms = allTerms.filter((item, pos, self) => self.indexOf(item) !== pos);
                const uniqueTerms = new Set(duplicatedTerms);
                return Array.from(uniqueTerms);
            }

            return [];
        }
    }
}
indieauthor.widgets.TermClassificationItem = {
    widgetConfig: {
        widget: "TermClassificationItem",
        type: "specific-element",
        label: "column and Classification item",
        category: "interactiveElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget widget-column-classificacion-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/></div><div class="b2" data-prev><span>{{translate "widgets.TermClassificationItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            column: modelObject.data.column,
            terms: modelObject.data.terms.length > 0 ? this.functions.reduceTerms(modelObject.data.terms) : ""
        }

        var template = '<form id="f-{{instanceId}}"><div class="form-group"><label for="column">{{translate "widgets.TermClassificationItem.form.column.label"}}</label><input type="text" class="form-control" name="column" required placeholder="{{translate "widgets.TermClassificationItem.form.column.placeholder"}}" value="{{column}}" autocomplete="off" /><small class="form-text text-muted">{{translate "widgets.TermClassificationItem.form.column.help"}}</small></div><label for="definition">{{translate "widgets.TermClassificationItem.form.terms.label"}}</label><textarea rows="4" class="form-control" name="terms" placeholder="{{translate "widgets.TermClassificationItem.form.terms.placeholder"}}" required>{{terms}}</textarea><small class="form-text text-muted">{{translate "widgets.TermClassificationItem.form.terms.help"}}</small></form>';
        var rendered = indieauthor.renderTemplate(template, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TermClassificationItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) { },
    preview: function (modelObject) {
        const element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        let prev = indieauthor.strings.widgets.TermClassificationItem.prev;

        if (modelObject.data.column && modelObject.data.terms.length > 0) {
            const allWords = this.functions.reduceTerms(modelObject.data.terms);
            prev = `${modelObject.data.column} - ${allWords}`;
        }

        element.innerHTML = prev;
    },
    emptyData: function (options) {
        return {
            data: {
                column: "",
                terms: []
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.column = formJson.column;
        modelObject.data.terms = this.functions.parseTerms(formJson.terms);
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.column.length === 0) errors.push("TermClassificationItem.column.empty")

        if (widgetInstance.data.terms.length === 0) errors.push("TermClassificationItem.terms.empty")

        if (errors.length > 0)
            return {
                element: widgetInstance.id,
                keys: errors
            }

        return undefined;
    },
    validateForm: function (formData) {
        const keys = [];

        if (!this.functions.matchTerms(formData.terms)) keys.push("TermClassificationItem.terms.invalid");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAvCAMAAACvztidAAAAnFBMVEUAAAB4h5oeN1YeN1YoQF54h5okPFt4h5p4h5oeN1YeN1YqQl8mPlx4h5opQF54h5pEWXMeN1b///8eN1Z4h5qOm6pWaIBhc4nHzdX5DVz6KnDx8vTj5ur8hq39wtb9pMKqtL/8dqP7Z5lygpU5T2v3GGQ0Mlf/8PX+4ev+0eD6SYRPY3tHXHW4wMqcp7WAjqD7WI7UJ2iTKF5HL1d5YSg4AAAAEnRSTlMAQECA/jD34NBgELqmoJeAcDCW+Nc0AAABIElEQVRIx83U23KCMBCA4ZgCWnvOJoBBQLB46rl9/3drgGiQTtm90fG/ysU3TFhCWB0f7om5rgJACq739tZ7T8Rg8w+wmsObQFPBtN3Eq8BLgLc4FITOjNWh7voIz+Mmg0HZoLeOxg8Wq+fQBDUWNuitIynvLFbChGHpH+HZn9IuHpGf7LDbM47dNHC87wR4ETbRsFrGJqDg/pzTA84txue8/tZ6Q9vGqqi+MtoLbstZuaWNLttVxYo251zrdD0wjVg11VtNtc6R0YXtD7Epql1GnfNn+YN8FOQ8n/Pw41eBw/gl4zDaxWHSzW8xhxjHyls2mN14iwR5roIX2WJ2D1iesRazKTc9Rv9noMU2X6I5zCaYHTOXP0Gsz7qNBjPgFwmdi7gk6W/UAAAAAElFTkSuQmCC",
    functions: {
        parseTerms: function (terms) {
            let termsArray = [];
            let termsCopy;

            if (this.matchTerms(terms)) {
                termsCopy = terms.endsWith(";") ? terms.slice(0, -1) : terms;
                termsArray = termsCopy.split(";").map(term => {
                    return term.trim().replace(/\s+/g, ' ');
                });

                termsArray = Array.from(new Set(termsArray));
            }

            return termsArray;
        },
        reduceTerms: function (terms) {
            return terms.map(t => t.trim()).reduce((pv, cv) => pv + ";" + cv);
        },
        matchTerms: function (terms) {
            const regex = /^[^;]+(?:;[^;]*)*$/;
            if (indieauthor.utils.isStringEmptyOrWhitespace(terms)) return false;
            return regex.test(terms);
        }
    }
}
indieauthor.widgets.GapQuestion = {
    widgetConfig: {
        widget: "GapQuestion",
        type: "specific-element",
        label: "Gap Question",
        category: "exerciseElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.GapQuestion.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            answers: [],
            question: modelValues.data.question,
            preview: modelValues.data.question.replace('[blank]', '____'),
            feedback: modelValues.data.feedback
        }

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = modelValues.data.answers[i];
            if (answer)
                templateValues.answers.push(answer)
            else
                templateValues.answers.push({
                    text: "",
                    correct: false
                })
        }

        var tempalte = '<form id="f-{{instanceId}}"> <div class="form-group"> <label>{{translate "widgets.GapQuestion.form.questionText.label"}}</label> <textarea class="form-control" name="question" placeholder="{{translate "widgets.GapQuestion.form.questionText.placeholder"}}" required>{{question}}</textarea> <small class="form-text text-muted">{{translate "widgets.GapQuestion.form.questionText.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.GapQuestion.form.questionPreview.label"}}</label> <textarea class="form-control" placeholder="{{translate "widgets.GapQuestion.form.questionPreview.placeholder"}}" name="questionPreview" readonly>{{preview}}</textarea> <small class="form-text text-muted">{{translate "widgets.GapQuestion.form.questionPreview.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.GapQuestion.form.answers.label"}}</label>{{#each answers}}<div class="input-group input-answer"> <div class="input-group-prepend"> <div class="input-group-text"> <input type="radio" name="correctAnswer"{{#if correct}}checked="true"{{/if}} value="{{@index}}"> </div></div><input class="form-control" type="text" autocomplete="off" name="answer{{@index}}" value="{{text}}"/> </div>{{/each}}<small class="form-text text-muted">{{translate "widgets.GapQuestion.form.answers.help"}}</small> </div><div class="form-group"> <label>{{translate "common.feedback.label"}}</label> <small class="form-text text-muted mb-1">{{translate "common.feedback.help"}}</small> <div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-success"><i class="fas fa-check-circle"></i></span></div><input type="text" class="form-control" name="feedbackPositive" placeholder="{{translate "common.feedback.positive"}}" value="{{feedback.positive}}"/> </div><div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-danger"><i class="fas fa-times-circle"></i></span></div><input name="feedbackNegative" type="text" class="form-control" placeholder="{{translate "common.feedback.negative"}}" value="{{feedback.negative}}"/></div></div></form>';
        var rendered = indieauthor.renderTemplate(tempalte, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.GapQuestion.label
        };
    },
    settingsClosed: function (modelObject) {
        $("#f-" + modelObject.id + " [name=question]").off('keyup');

    },
    settingsOpened: function (modelObject) {
        $("#f-" + modelObject.id + " [name=question]").on('keyup', function () {
            var questionText = $("#f-" + modelObject.id + " [name=question]").val();
            $("#f-" + modelObject.id + " [name=questionPreview]").val(questionText.replace('[blank]', '____'));
        });
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.question ? modelObject.data.question : indieauthor.strings.widgets.GapQuestion.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                question: "",
                answers: [],
                feedback: {
                    positive: "",
                    negative: ""
                }
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.answers = [];
        modelObject.data.question = formJson.question;
        modelObject.data.feedback.positive = formJson.feedbackPositive;
        modelObject.data.feedback.negative = formJson.feedbackNegative;

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = formJson["answer" + i];
            if (answer && (answer.length > 0)) {
                var answerObj = {};
                answerObj.text = answer;

                if (parseInt(formJson.correctAnswer) == i)
                    answerObj.correct = true;
                else
                    answerObj.correct = false;

                modelObject.data.answers.push(answerObj)
            }
        }
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.question.length == 0)
            errors.push("GapQuestion.question.empty");

        if (!this.extensions.validateQuestionBlankSpots(widgetInstance.data.question))
            errors.push("GapQuestion.question.onlyOneBlank");

        if (this.extensions.answersWithoutCorrect(widgetInstance.data.answers))
            errors.push("GapQuestion.answers.noCorrect");

        if (widgetInstance.data.answers.length < 2)
            errors.push("GapQuestion.answers.notEnoughAnswers");

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var answers = [];
        var errors = [];

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = formData["answer" + i];
            if (answer && (answer.length > 0)) {
                var answerObj = {};
                answerObj.text = answer;

                if (parseInt(formData.correctAnswer) == i)
                    answerObj.correct = true;
                else
                    answerObj.correct = false;

                answers.push(answerObj)
            }
        }

        if (formData.question.length == 0)
            errors.push("GapQuestion.question.empty");

        if (!this.extensions.validateQuestionBlankSpots(formData.question))
            errors.push("GapQuestion.question.onlyOneBlank");

        if (this.extensions.answersWithoutCorrect(answers))
            errors.push("GapQuestion.answers.noCorrect");

        if (answers.length < 2)
            errors.push("GapQuestion.answers.notEnoughAnswers");

        return errors;
    },
    extensions: {
        validateQuestionBlankSpots: function (questionText) {
            if (!questionText || (questionText.length == 0))
                return false;

            var count = (questionText.match(/\[blank\]/g) || []).length;
            return (count == 1);
        },
        answersWithoutCorrect: function (answers) {
            for (var i = 0; i < answers.length; i++) {
                var answer = answers[i];
                if (answer.correct)
                    return false;
            }

            return true;
        },
        maxAnswers: 4
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAACYUlEQVRoBe2ZT2gTQRSHfwmxYlqaLUSloGNRRBQEL7IgQtOL+OdgBVlEKCpCRLykl7rxpKfk1npRWBARFCV48JJDTk3sxVgQoRKhF+OehRqtPUjbkVkzaaKzZaXtzEbmg4XMy7DzzcvsbHZfBG0Q0zoGYBRqqQN45VYLX/0sWtLEtCYBZPYM7gQ7VPHmXQ1N8QtutfDeV4OY1l1iWrRUeUtV0/i+SE+PTVBiWgvEtIz1pBcevSgqF+Yw8ROjt5h4RuQbJaaVAmBcPDeseCmv0d/Xi1PDx1n7vOj7KP/AOoaJxDo+0VCZBkRLbzbbe7YZds5J2TmnYxcJtbTR38dudtMAPtk55yqPd8vyYJl+zLKOLlzTV9CF0kPQu4dEtLQs/jPpxhKWbzr4ufeGd6zYT71YGIj5OSxfnsLqzMdWe+VBCbSxhNjDtHJtoTR1v3QIc1afzQB/SLNfgM65Gxcp3gneVxht/Ah8AiYsmuBWIpSOHN2HCEl6Ge+Ik+Tfs/6HDG0Wvhdi7HkGSMTXAon471gI8L0QWbZ7PkyCzn1utTsmoRBfaZ7dyMnDoRBtR98RZaGlZaGlZaGlZaGlZaGlZRFtFmV4gSY0lF7Poje+Q5xpt1pg0uV7U0/wbTH4E8tW8rJYQW2+jv1kUDgK/2s6XpuvT58Zu21cv3QWRw4OKZFlSStVZj3pQwcIdiUHhP3a64jsdSqrJab4iz4V7E4OeMI+tcxyPpseaT0ENCuk10Q97ZxDVU1CRNDdw79yKhfPI6j0eAiE2Uq4j6DS+Wy6zGrVfHtUABt/JJ9Nqxp/gwD4BRpSrRtKNuT5AAAAAElFTkSuQmCC"
}
indieauthor.widgets.SimpleQuestion = {
    widgetConfig: {
        widget: "SimpleQuestion",
        type: "specific-element",
        label: "Simple Question",
        category: "exerciseElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.SimpleQuestion.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            answers: [],
            question: modelValues.data.question,
            feedback: modelValues.data.feedback
        }

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = modelValues.data.answers[i];
            if (answer)
                templateValues.answers.push(answer)
            else
                templateValues.answers.push({
                    text: "",
                    correct: false
                })
        }

        var tempalte = '<form id="f-{{instanceId}}"> <div class="form-group"> <label>{{translate "widgets.SimpleQuestion.form.questionText.label"}}</label> <textarea class="form-control" name="question" placeholder="{{translate "widgets.SimpleQuestion.form.questionText.placeholder"}}" required>{{question}}</textarea> <small class="form-text text-muted">{{translate "widgets.SimpleQuestion.form.questionText.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.SimpleQuestion.form.answers.label"}}</label>{{#each answers}}<div class="input-group input-answer"> <div class="input-group-prepend"> <div class="input-group-text"> <input type="radio" name="correctAnswer"{{#if correct}}checked="true"{{/if}}value="{{@index}}"> </div></div><input class="form-control" type="text" autocomplete="off" name="answer{{@index}}" value="{{text}}"/> </div>{{/each}}<small class="form-text text-muted">{{translate "widgets.SimpleQuestion.form.answers.help"}}</small> </div><div class="form-group"> <label>{{translate "common.feedback.label"}}</label> <small class="form-text text-muted mb-1">{{translate "common.feedback.help"}}</small> <div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-success"><i class="fas fa-check-circle"></i></span></div><input type="text" class="form-control" name="feedbackPositive" placeholder="{{translate "common.feedback.positive"}}" value="{{feedback.positive}}"/> </div><div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-danger"><i class="fas fa-times-circle"></i></span></div><input name="feedbackNegative" type="text" class="form-control" placeholder="{{translate "common.feedback.negative"}}" value="{{feedback.negative}}"/></div></div></form>';
        var rendered = indieauthor.renderTemplate(tempalte, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.SimpleQuestion.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.question ? modelObject.data.question : indieauthor.strings.widgets.SimpleQuestion.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                question: "",
                answers: [],
                feedback: {
                    positive: "",
                    negative: ""
                }
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.answers = [];
        modelObject.data.question = formJson.question;
        modelObject.data.feedback.positive = formJson.feedbackPositive;
        modelObject.data.feedback.negative = formJson.feedbackNegative;

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = formJson["answer" + i];
            if (answer && (answer.length > 0)) {
                var answerObj = {};
                answerObj.text = answer;

                if (parseInt(formJson.correctAnswer) == i)
                    answerObj.correct = true;
                else
                    answerObj.correct = false;

                modelObject.data.answers.push(answerObj)
            }
        }
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.question.length == 0)
            errors.push("SimpleQuestion.question.empty");

        if (this.extensions.answersWithoutCorrect(widgetInstance.data.answers))
            errors.push("SimpleQuestion.answers.noCorrect");

        if (widgetInstance.data.answers.length < 2)
            errors.push("SimpleQuestion.answers.notEnoughAnswers");

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var answers = [];
        var errors = [];

        for (var i = 0; i < this.extensions.maxAnswers; i++) {
            var answer = formData["answer" + i];
            if (answer && (answer.length > 0)) {
                var answerObj = {};
                answerObj.text = answer;

                if (parseInt(formData.correctAnswer) == i)
                    answerObj.correct = true;
                else
                    answerObj.correct = false;

                answers.push(answerObj)
            }
        }

        if (formData.question.length == 0)
            errors.push("SimpleQuestion.question.empty");

        if (this.extensions.answersWithoutCorrect(answers))
            errors.push("SimpleQuestion.answers.noCorrect");

        if (answers.length < 2)
            errors.push("SimpleQuestion.answers.notEnoughAnswers");

        return errors;
    },
    extensions: {
        answersWithoutCorrect: function (answers) {
            for (var i = 0; i < answers.length; i++) {
                var answer = answers[i];
                if (answer.correct)
                    return false;
            }

            return true;
        },
        maxAnswers: 4
    },
    icon: " data:image/png;base64,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"
}
indieauthor.widgets.Test = {
    widgetConfig: {
        widget: "Test",
        type: "specific-element-container",
        label: "Test",
        allow: ["GapQuestion", "SimpleQuestion", "TrueFalseQuestion"],
        category: "exerciseElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}">  <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate label}}</span></div>', {
            category: this.widgetConfig.category,
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            label: "widgets." + this.widgetConfig.widget + ".label"
        });
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id,
            prev: "widgets." + this.widgetConfig.widget + ".prev"
        });
        return element;
    },
    template: function () {
        return '<div class="widget-test" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"/> </div><div class="b2" data-prev><span>{{translate "widgets.Test.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Test.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.Test;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0)
            keys.push("Test.data.empty")

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADpUlEQVRoge2ZX0hTURzHf5tZ5HRO0EKoqxQarIQoZJLknxdNDdKQGZVYmEbWgwPRLTLzxa1QZi8+TC0iAqcSPaRhL275kCZJUC7Qh+YIeigw/z7kn8XvbHep99y1cePeq/SFca9nh93P+fk9v9+55yhggxid/jgAFIO0cgPAC89Y708+igA0o9NbAaD2QGIC4EcqjU64wA9e4hnr/cCLwej09xid3jvkfOeVWnMLi94z5fVeRqefZXR6TTDo2e6eAcmBWSH4qeKbCF5L41UyOn0OAGhKi7IltvIfqaNVkJedjn+fo32vZG+wo5wUG4RHKSvSELUzob0fZwDmlsWh2aI9uyM1RrMtx2i2bcoivNAIu3LMACuZd+DXweuwerFddHiNOhqL3TAAfDGabVfYdjr03DKsFLaA1/Mj0LT+8j2smZ+LQ8sVRvoxRh2/2UXrwWeJtWcjEGG5vKlttahFMJEijeH8Lo8qAMBBhQ5H6yOfBUOHkQ2SgS/SirQkgNgoTrQjLp3m9N09/zR8SoGiDzI2CiIHb4OCiQ80Kc+ehAjTedEBaeK1B0Y78pOV+FvBJPgiLxP91dPEKjLTzqqIX799h6qGVkjKKIPMklvQ3tUvLlkQ8dqjrKaZgONbDF6tXX2kvfZaqTyh8ZUHQXFN23m/DlzTbigob4C+AQcHGgcnVNrUZGiqrRAGzepoCsnloE1JDkScNkCxRYVmX2y77YPkOjntDkR+q2ZG7aJDUyciQrc11sD8whLx8mvnOPkXtjXeEB2QJl574DtjxgltwBJ4LxcF9bTUeyB82pbFhTfS84tL8KjnFbydmAR1jAoqywplYxFe6Kr61k3pDCdj54M6yMviZhCxxVtc8IMZw95xl9zjIKxd/Rzof1Hecd6Es1kUdCLmZ6X7dnvwGqMC15Sb04ct70KEthMMrY7xrZ2xbGtTk8A1NUNyNq242DuaBEOzzwtVVGgs2zjy/gEnsYXvh1VgoCyWpJicvPbAipifnU6iDP5iI5ecHdTT6GU5ZIut+r8BKZa2LTRJvlIs5oNp6M04qKL2UnsoPWO9CO1obn9C1htyEKZaLGSHmEQqDZs9DK4p93BBeYOm8kIhydNSCIM25Bwn0EcOM7AvPo5KsfEcEbdT8Swxh93ok0L74+MIME9NcFhM1bmBPO0/Ib1K62k027yy8I1foWYP/pNTcUU4QoU2yAAYnfAQQoW2mKodeFbNpkcJhM/PtZiqpXq+QAHAb/c0MPPN6684AAAAAElFTkSuQmCC"
}
indieauthor.widgets.TrueFalseQuestion = {
    widgetConfig: {
        widget: "TrueFalseQuestion",
        type: "specific-element",
        label: "True or false question",
        category: "exerciseElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {},
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-question" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.TrueFalseQuestion.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            question: modelValues.data.question,
            feedback: modelValues.data.feedback
        }

        var tempalte = `<form id="f-{{instanceId}}">
            <div class="form-group">
            <label>{{translate "widgets.TrueFalseQuestion.form.questionText.label"}}</label>
            <textarea class="form-control" name="question" placeholder="{{translate "widgets.TrueFalseQuestion.form.questionText.placeholder"}}" required>{{question}}</textarea>
            <small class="form-text text-muted">{{translate "widgets.TrueFalseQuestion.form.questionText.help"}}</small>
            </div>
                <div class="form-group">
                    <label>{{translate "widgets.TrueFalseQuestion.form.answer.label"}}</label>
                    <select name="correctAnswer" class="form-control" required>
                        <option value="true">{{translate "widgets.TrueFalseQuestion.form.answer.true"}}</option>
                        <option value="false">{{translate "widgets.TrueFalseQuestion.form.answer.false"}}</option>
                    </select>
                    <small class="form-text text-muted">{{translate "widgets.TrueFalseQuestion.form.answer.help"}}</small>
                </div>
                <div class="form-group">
                    <label>{{translate "common.feedback.label"}}</label>
                    <small class="form-text text-muted mb-1">{{translate "common.feedback.help"}}</small>
                    <div class="input-group">
                        <div class="input-group-prepend">   
                            <span class="input-group-text text-success">
                                <i class="fas fa-check-circle"></i>
                            </span>
                        </div>
                        <input type="text" class="form-control" name="feedbackPositive" placeholder="{{translate "common.feedback.positive"}}" value="{{feedback.positive}}"/>
                    </div>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text text-danger">
                                <i class="fas fa-times-circle"></i>
                            </span>
                        </div>
                        <input name="feedbackNegative" type="text" class="form-control" placeholder="{{translate "common.feedback.negative"}}" value="{{feedback.negative}}"/>
                    </div>
                </div>
            </form>`;
        var rendered = indieauthor.renderTemplate(tempalte, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TrueFalseQuestion.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {
        $("#modal-settings [name='correctAnswer']").val(indieauthor.utils.booleanToString(modelObject.data.answer));
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.question ? modelObject.data.question : indieauthor.strings.widgets.TrueFalseQuestion.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                question: "",
                answer: true,
                feedback: {
                    positive: "",
                    negative: ""
                }
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.answer = indieauthor.utils.parseBoolean(formJson.correctAnswer);
        modelObject.data.question = formJson.question;
        modelObject.data.feedback.positive = formJson.feedbackPositive;
        modelObject.data.feedback.negative = formJson.feedbackNegative;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.question.length == 0)
            errors.push("TrueFalseQuestion.question.empty");

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (formData.question.length == 0)
            errors.push("TrueFalseQuestion.question.empty");

        return errors;
    },
    extensions: {},
    icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAwCAYAAACFUvPfAAAACXBIWXMAAC4jAAAuIwF4pT92AAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAACP1JREFUeNrMmXmQVMUdxz/d7825M+zsvQLLigkruqIi664hghAwagIBtaTMH3gfJCkVE0NErYopyngVRylYpXjFMnhn1ZQHhiSCeBQaKBUwoMKuuMix7Dmzc73XnT/esjsDM+wMMEl+U13zZl6/ft/+9e/+iVFNcwAwDNnY09s3r7O7d6LWOiGEiACS3Ehz9KQB0f8ttdYlRX7ftvLSYau05jmtD1/aBDBd5vU7W3c/VlEW4vzJDQgh0Eo7SxWKsmzTMCQt3+4Zs3XLVzNqaodfaEh5pToEuGkY8szW1t2PTRhXx5+W3RE9dUyt7uewPmT5fLkphvitD7keGJ3dYbnwvscCjz7dfEXt6BGb0CxLW6j89FkvKMuas3Xts7Gq8pAGDEAd45GTcuS5bkql/GcDTJ0zP/DBhs0HqqvLRgDxgxNle3vHeVMnNVBVHqKfwwcflinj0N+5DJHynWkcKtNmP8MMwAUYF184SSe6esqAk9JlWmm/x2UAeI6Ba8d6IhkpGkuAIQASAFprtAYTIeJJyw4ytNoVUi0zUsKyQAqEEInecB+2UrhdpmM98qa+mLMFn7egoKUQoDQdXT2RUcOrOGvcGLwed+6g9brN2C++j/5kB3p3JwINJ1UgZzdizJ9dENBKKYgnmDDuZP/0SRM6fF4P8XgiB9D7erBuWoH94j+AKBBA4EUB7NqBWvt31OOrMZ9egGgYfVxBW5YNHg8/mFC/zjSMD/fu71wkpfj3kKCTExdif/0R0lUHfg90h9FEAAPhqwaXG7VlM8nG+bj3PAOVxcdZRiSRaGy01+MeLaW4DDjxiG7avut57K8/RpaOB5dEd7dCkRfZdCZyXB1EOyHcjQjVofU+rBsfL4Dn1GitVb/tdgGLsoPuCGPf24zkBIjHoa8T89a5uDYvxfXRvbg+W4K5aiGoJER7EZ4TsV99G71xR6Gcvuq/npYVtHprE1rthaJidKQNOWcaxpJrECdWDJ7czydhLLgcHd8DXg/Qh3rqnwXRyRTQOito/XmrM084c+XcKZlF7qaLEJ4qCPcBftTn3xQCtAm4B96ZdVpv1PGolo0ggCgPZvY4I0uhsgrsmCNy4VihxEMPDRrhyH4sCSRB6awmkQN7wPACFrjNQoCWKVhFdtCxBJoDQBRNBN0bzWxLb1iB7uuCQBHQixyfp61OapLn/wa1ck2uiqizskX+eibuOWcjgkG0BDm25nCTeN1y7NfeRARHo8NdCELIW36anwOZdifWe8sRFTXI66fnFPtkBS3qaxD1NVkjJevS+7D/0owoGgNJC+wWzHvuRtSdkDvgy5aQfG8lrpl/wHz2llzTsqMLmKxZ92O//goiMBZsGx1rwbzuRuQds3Jew/7dC+iXF+Nrugpev/14KWIWg/nQ21ivP48InAK2hY5+iXnzNRgr5+W8RnzNp/DAH3FVT4H3H8xVEY2D1/lxencH1m2PI2Wt416j32Le+guMJdcMTGk/0MW8O5fy1c42kpaV9ni7G5qqh/Pn5n3EcHG1P8nWK25i5qn1PHjnvKGcy0AqmBen7aVvoJO7IFCKjuzCuPySNMAA0XiCV155h7a97VSWlVBZFqKyLERFWYiSk4Yz46XtBLu38cX0GbTOrmfbmk94bfX6vDKcvDit1m4Bip0gqbwG85mbMwRlEpRm8aKbuWLmjw7JnzQ8MZ1ExUia/nY3/wKuk37eWfdJLuLB0Hb68NwHvusE/GjVhZx4OriMw+sWGvCYtEUy2PVLFxOP78C18rcDbIvF4hiGkbenyR20ZfeLlwW+zC/qNWHEiGrOue0puPbJQfX/rJXYW88hR16EmHXW4Olpjcgz+8wdtMtA7+9BswdNO3pvd2YRkgJvwE95Wws8+Qj6/W3O/80b0OxBXjn5uERPuZHbxGxeAJEoGCBqMzuR4qTmazvKG5f9hHEvbcC6egWu7Q+hP9yOoAJ5wRlHG5oOWI/cQQuBnNkwtIUB2LGPoocWwthG7EULMO5pRm//DumtR5z9vaOtjYj8FTG/ggUimoS7ZyCpxbrrCdTO7cjz6sHr/u+Cti5fSuK0X5I47VdYsx/IPtGQ6G27QYKc+zMU+4Eo4sza45YR5C5Y679AtW109Hd35AjhpkXZsIDzgiVXY76wmlhiL8a54w6bGgz4SSStwoF27LLpgHZlt62G18OHm7ZSM7KKaJGbs8Z+n7LPeti4q4X2j8GrBouDW79sIeAfslKlU2uKeYGW9TVgOQ0CefKorCm/L+hn+bJnWL5iFRQJroqX8jAhzl20mKgVBUsMYunqZeKsablGeUbeoM2/LkzfcwaqKAuxZtViEskkAkFCgj+cwH70XVbfMBkd8KY5B9uyKS0Zlo8/MfITDyGGrJ263S6axp9y+I2GeiYFjrpgqVLAq4JkoRkpcEwVVpHOdq09pmnw/0imYRwsi4mU+ESYCBG3bBV06gQZDbpSSplaI466rK71YIKXLfFLjZq00+Xy+72QSGJbthJCDLrx0vKSde+u33hJV0/YDg0LqBQzONAsklIazm5Fzj2MXPenD66oQet+tZHO06++9R7e6nKKhwVkMmkPhuzFQf99Bzq6mXHl7d6d33wnU+pmOl0HRRr7hxq5C2v/Rwik06og0hdj/u8fZv2ba5l+7gRKioM6kUwOtAbFqKY5mKZx146WtkUjh1fSNP5UfD5P2ouTlo1SKl0+RAbTn3ovtQ+bMkkfwXVIQ6Jsxadbv2LbB5to+PEP9cUXTSYWT5B0vKYAWkRKm3luV09kXmdH1xiUcoEAITSRPhu/r9zt82IrO4uZPlJfM70xplNuO4cnUkTfuVteGqLhjJNV4xljbSmFCEdiWjoi404DnUIlgCmlUJ3dYWpHVOkLpjS+DEy1LNuicK05B7TW+PxeHQoGdKQvKmLxBLIfcX9R/ZtMdroTIBZPUBws4sIpjVRVlL7d0xuZKoSQqQqfRTiOmWzbFp3dvU4tehDwQdqQ1bmEIzEmN9VRXVnG3v0djwghrgXq/semOw4sMI9kjFymiWXZCCHCQAOwDDgH8DnZbUZjkQ/nc5lr9PuQLcBCYOd/BgDJzHikP0LyMQAAAABJRU5ErkJggg=="
}
indieauthor.widgets.TextBlock = {
    widgetConfig: {
        widget: "TextBlock",
        type: "element",
        label: "Text Block",
        category: "simpleElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img  src="' + this.icon + '" class="img-fluid" /> <br/> <span> {{translate label}}</span></div>', {
            category: this.widgetConfig.category,
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            label: "widgets." + this.widgetConfig.widget + ".label"
        });
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id,
            prev: "widgets." + this.widgetConfig.widget + ".prev"
        });
        return element;
    },
    template: function () {
        return '<div class="widget widget-textblock" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1" ><img src="' + this.icon + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate prev}}</span></div><div class="b3" data-toolbar></div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            label: "widgets." + this.widgetConfig.widget + ".form.label",
            help: "widgets." + this.widgetConfig.widget + ".form.help"
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"><label for="textblockText">{{translate label}}</label><textarea rows="10" class="form-control texteditor" name="textblockText"></textarea><small class="form-text text-muted">{{translate help}}</small></div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TextBlock.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        var editorElement = $('#f-' + modelObject.id + ' .texteditor');
        indieauthor.widgetFunctions.initTextEditor(modelObject.data.text, editorElement);
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.text.length > 0 ? modelObject.data.text : indieauthor.strings.widgets.TextBlock.prev;
    },
    emptyData: function () {
        return {
            data: {
                text: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.text = indieauthor.widgetFunctions.clearAndSanitizeHtml(formJson.textblockText);
    },
    validateModel: function (widgetInstance) {
        if (widgetInstance.data.text.length == 0)
            return {
                element: widgetInstance.id,
                keys: ["TextBlock.text.invalid"]
            };

        if (indieauthor.widgetFunctions.isEmptyText(widgetInstance.data.text))
            return {
                element: widgetInstance.id,
                keys: ["TextBlock.text.invalid"]
            };

        return undefined;
    },
    validateForm: function (formData) {
        if (formData.textblockText.length == 0)
            return ["TextBlock.text.invalid"];

        if (indieauthor.widgetFunctions.isEmptyText(formData.textblockText))
            return ["TextBlock.text.invalid"];

        return [];
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAwCAYAAABuZUjcAAAACXBIWXMAAAsSAAALEgHS3X78AAACPElEQVRogWMYqoAR2d1y5mEFDAwM+QwMDAoD7J8NDAwMhY9OrnqASwHc4XLmYfMZGBgSkiK8GNztTOnmQnTw5PlrhrkrtzFcu/XgAwMDg+Ojk6su4FQsZx7mIGce9n/nwVP/BwP4+PnLf4/Ysv9y5mH7cbmZCUrHu9mbMrgNYEgjAz4ebobe2kyQCChAsSZbmMMVtFUHOlmjAi2Ee/A6fMiBUYfTG7AQY9/f9vUMf9vX0cxpbJ8W45SzM9fvlwlwAZXnEzsq0w7AxIlyOKOcCAOTrSaVnEkaYGNlMWBgYADhgIr2WYkdlWkLiHY4U7QtGA8C0M/AwAB2+FBL4wIV7bMcGEZLlQEAow6nNxj05TguMOjLcVxgqJXjcDCaOekNRh1ObzBajuMDoKKUZWsVFZyLAHQpxxl15cjWiwuMluP0BqMOpzcYdTi9wajD6Q1GHU5vMPQd/vHL14F1CRoAzQXhAzCHb1yz9SDDp0HkeJB72FhZGMREBLHKwxy+4NPnrx/Cs5oI+pQeYN7KbQz9c1Yz6Goo4bQNeboQNJQLmjI00FJTYODj4RoQR1+7/ZDh0+evYEfjcLgjaJwc3qyFzicagqYOr9164ICsUk5a3J6fl9sBmynUBqBJK3ERQQZuLg68JmO0xx+dXAUa9T+ALBbVPgs040wXhxMBQBO3RBeHG2AaBhg86KhMu0C0wzsq00BzMIUD7GhQwAXCOIz41aKCivZZoMnSBNq6DysAOXpBR2XaYIh1CgADAwMAv3EUkQX/fccAAAAASUVORK5CYII=",
}
indieauthor.widgets.TrueFalseContainer = {
    widgetConfig: {
        widget: "TrueFalseContainer",
        type: "specific-element-container",
        label: "True false",
        allow: ["TrueFalseItem"],
        category: "interactiveElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) {
        var item = {};
        item.content = indieauthor.renderTemplate('<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.TrueFalseContainer.label"}} </span></div>', this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function (options) {
        return '<div class="widget-true-false" data-widget="{{widget}}" data-type="{{type}}" data-id="{{id}}"><div class="widget"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /> </div><div class="b2" data-prev><span>{{translate "widgets.TrueFalseContainer.label"}}</span></div><div class="b3" data-toolbar>  </div></div><div data-widget="{{widget}}" data-type="{{type}}" class="element-container dragula-container" data-content></div></div>';
    },
    getInputs: function (modelObject) {
        var templateValues = {
            instanceId: modelObject.id,
            instanceName: modelObject.params.name,
            help: modelObject.params.help
        }

        var inputTemplate = '<form id="f-{{instanceId}}"><div class="form-group"> <label for="instanceName">{{translate "common.name.label"}}</label> <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/> <small class="form-text text-muted">{{translate "common.name.help"}}</small></div><div class="form-group"> <label for="help">{{translate "common.help.label"}}</label> <div class="input-group mb-3"> <input name="help" type="text" class="form-control" placeholder="{{translate "common.help.placeholder"}}" value="{{help}}"> <div class="input-group-append"> <button class="btn btn-indie" type="button" onclick="$(\'input[name=help]\').val(\'\')">{{translate "common.help.button"}}</button> </div></div><small class="form-text text-muted">{{translate "common.help.help"}}</small> </div></form>';
        var rendered = indieauthor.renderTemplate(inputTemplate, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TrueFalseContainer.label
        };
    },
    settingsClosed: function (modelObject) {},
    settingsOpened: function (modelObject) {},
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.querySelector("span").innerHTML = modelObject.params.name ? modelObject.params.name : indieauthor.strings.widgets.TrueFalseContainer.label;
    },
    emptyData: function (options) {
        var object = {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
                help: ""
            },
            data: []
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.params.name = formJson.instanceName;
        modelObject.params.help = formJson.help;
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (widgetInstance.data.length == 0) keys.push(" TrueFalseContainer.data.empty");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0)
            return {
                element: widgetInstance.id,
                keys: keys
            }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: " data:image/png;base64,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"
}
indieauthor.widgets.TrueFalseItem = {
    widgetConfig: {
        widget: "TrueFalseItem",
        type: "specific-element",
        label: "True or false question",
        category: "interactiveElement",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function (params) { },
    createElement: function (widgetInfo) {
        var element = indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
        return element;
    },
    template: function (options) {
        return '<div class="widget widget-true-false-item" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"><div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item" /></div><div class="b2" data-prev><span>{{translate "widgets.TrueFalseItem.prev"}}</span></div><div class="b3" data-toolbar> </div></div>';
    },
    getInputs: function (modelValues) {
        var templateValues = {
            instanceId: modelValues.id,
            question: modelValues.data.question,
            feedback: modelValues.data.feedback
        }

        var tempalte = '<form id="f-{{instanceId}}"> <div class="form-group"> <label>{{translate "widgets.TrueFalseItem.form.questionText.label"}}</label> <textarea class="form-control" name="question" placeholder="{{translate "widgets.TrueFalseItem.form.questionText.placeholder"}}" required>{{question}}</textarea> <small class="form-text text-muted">{{translate "widgets.TrueFalseItem.form.questionText.help"}}</small> </div><div class="form-group"> <label>{{translate "widgets.TrueFalseItem.form.answer.label"}}</label> <select name="correctAnswer" class="form-control" required> <option value="true">{{translate "widgets.TrueFalseItem.form.answer.true"}}</option> <option value="false">{{translate "widgets.TrueFalseItem.form.answer.false"}}</option> </select> <small class="form-text text-muted">{{translate "widgets.TrueFalseItem.form.answer.help"}}</small> </div><div class="form-group"> <label>{{translate "common.feedback.label"}}</label> <small class="form-text text-muted mb-1">{{translate "common.feedback.help"}}</small> <div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-success"><i class="fas fa-check-circle"></i></span></div><input type="text" class="form-control" name="feedbackPositive" placeholder="{{translate "common.feedback.positive"}}" value="{{feedback.positive}}"/> </div><div class="input-group"> <div class="input-group-prepend"><span class="input-group-text text-danger"><i class="fas fa-times-circle"></i></span></div><input name="feedbackNegative" type="text" class="form-control" placeholder="{{translate "common.feedback.negative"}}" value="{{feedback.negative}}"/></div></div></form>';
        var rendered = indieauthor.renderTemplate(tempalte, templateValues);

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.TrueFalseItem.label
        };
    },
    settingsClosed: function (modelObject) { },
    settingsOpened: function (modelObject) {
        $("#modal-settings [name='correctAnswer']").val(indieauthor.utils.booleanToString(modelObject.data.answer));
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = modelObject.data.question ? modelObject.data.question : indieauthor.strings.widgets.TrueFalseItem.prev;
    },
    emptyData: function () {
        var object = {
            data: {
                question: "",
                answer: true,
                feedback: {
                    positive: "",
                    negative: ""
                }
            }
        };

        return object;
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.answer = indieauthor.utils.parseBoolean(formJson.correctAnswer);
        modelObject.data.question = formJson.question;
        modelObject.data.feedback.positive = formJson.feedbackPositive;
        modelObject.data.feedback.negative = formJson.feedbackNegative;
    },
    validateModel: function (widgetInstance) {
        var errors = [];

        if (widgetInstance.data.question.length == 0)
            errors.push("TrueFalseItem.question.empty");

        if (errors.length > 0) {
            return {
                element: widgetInstance.id,
                keys: errors
            }
        }

        return undefined;
    },
    validateForm: function (formData) {
        var errors = [];

        if (formData.question.length == 0)
            errors.push("TrueFalseItem.question.empty");

        return errors;
    },
    extensions: {},
    icon: " data:image/png;base64,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"
}
indieauthor.widgets.Video = {
    widgetConfig: {
        widget: "Video",
        type: "element",
        label: "Video",
        category: "simpleElements",
        toolbar: {
            edit: true
        }
    },
    createPaletteItem: function () {
        var itemTemplate = '<div class="palette-item" data-category="{{category}}" data-type="{{type}}" data-widget="{{widget}}"> <img src="' + this.icon + '" class="img-fluid"/> <br/> <span> {{translate "widgets.Video.label"}}</span></div>';
        var item = {};
        item.content = indieauthor.renderTemplate(itemTemplate, this.widgetConfig);
        item.numItems = 1;
        return item;
    },
    createElement: function (widgetInfo) {
        return indieauthor.renderTemplate(this.template(), {
            type: this.widgetConfig.type,
            widget: this.widgetConfig.widget,
            id: widgetInfo.id
        });
    },
    template: function () {
        return '<div class="widget widget-video" data-type="{{type}}" data-widget="{{widget}}" data-id="{{id}}"> <div class="b1"><img src="' + this.icon + '" class="img-fluid drag-item"></div><div class="b2" data-prev><span>{{translate "widgets.Video.prev"}}</span></div><div class="b3" data-toolbar> </div></div';
    },
    getInputs: function (modelValues) {
                var inputTemplate = `
            <form id="f-{{instanceId}}">
                <div class="form-group">
                    <label for="instanceName">{{translate "common.name.label"}}</label>
                    <input type="text" name="instanceName" class="form-control" value="{{instanceName}}" placeholder="{{translate "common.name.placeholder"}}" autocomplete="off" required/>
                    <small class="form-text text-muted">{{translate "common.name.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="text">{{translate "widgets.Video.form.url.label"}}</label>
                    <input type="url" class="form-control" name="videourl" placeholder="{{translate "widgets.Video.form.url.placeholder"}}" value="{{{videourl}}}" autocomplete="off" required></input>
                    <small class="form-text text-muted">{{translate "widgets.Video.form.url.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="captions">{{translate "common.captions.label"}}</label>
                    <input type="url" class="form-control" name="captions" placeholder="{{translate "common.captions.placeholder"}}" value="{{{captions}}}" autocomplete="off"></input>
                    <small class="form-text text-muted">{{translate "common.captions.help"}}</small>
                </div>
                <div class="form-group">
                    <label for="descriptions">{{translate "common.descriptions.label"}}</label>
                    <input type="url" class="form-control" name="descriptions" placeholder="{{translate "common.descriptions.placeholder"}}" value="{{{descriptions}}}" autocomplete="off"></input>
                    <small class="form-text text-muted">{{translate "common.descriptions.help"}}</small>
                </div>
            </form>`;

        var rendered = indieauthor.renderTemplate(inputTemplate, {
            instanceId: modelValues.id,
            videourl: modelValues.data.videourl,
            captions: modelValues.data.captions,
            descriptions: modelValues.data.descriptions,
            instanceName: modelValues.params.name
        });

        return {
            inputs: rendered,
            title: indieauthor.strings.widgets.Video.label
        };
    },
    settingsClosed: function (modelObject) {
        $(`#f-${modelObject.id} input[name="videourl"]`).off('change');
    },
    settingsOpened: function (modelObject) {
        const toggle = this.functions.toggleCaptionAndDescriptions;
        toggle(modelObject, modelObject.data.videourl);

        $('#f-' + modelObject.id + ' input[name="videourl"]').on('change', function (e) {
            const videourl = e.target.value;
            toggle(modelObject, videourl);
            $("#modal-settings-body .errors").html('');
        });
    },
    preview: function (modelObject) {
        var element = document.querySelector('[data-id="' + modelObject.id + '"]').querySelector('[data-prev]');
        element.innerHTML = (modelObject.data.videourl) ? modelObject.params.name + ": " + modelObject.data.videourl : indieauthor.strings.widgets.Video.prev;
    },
    emptyData: function () {
        return {
            params: {
                name: this.widgetConfig.label + "-" + indieauthor.utils.generate_uuid(),
            },
            data: {
                videourl: "",
                captions: "",
                descriptions: ""
            }
        };
    },
    updateModelFromForm: function (modelObject, formJson) {
        modelObject.data.videourl = formJson.videourl;
        modelObject.params.name = formJson.instanceName;
        modelObject.data.captions = formJson.captions;
        modelObject.data.descriptions = formJson.descriptions;

        this.functions.putOrDeleteCaptionAndDescriptions(modelObject)
    },
    validateModel: function (widgetInstance) {
        var keys = [];

        if (!indieauthor.utils.isYoutubeVideoURL(widgetInstance.data.videourl) && !indieauthor.utils.isIndieResource(widgetInstance.data.videourl))
            keys.push("Video.videourl.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.captions) && !indieauthor.utils.isIndieResource(widgetInstance.data.captions))
            keys.push("common.captions.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(widgetInstance.data.descriptions) && !indieauthor.utils.isIndieResource(widgetInstance.data.descriptions))
            keys.push("common.descriptions.invalid");

        if (!indieauthor.utils.hasNameInParams(widgetInstance))
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(widgetInstance.params.name, widgetInstance.id))
            keys.push("common.name.notUniqueName");

        if (keys.length > 0) {
            return {
                element: widgetInstance.id,
                keys: keys
            }
        }

        return undefined;
    },
    validateForm: function (formData, instanceId) {
        var keys = [];

        if (!indieauthor.utils.isYoutubeVideoURL(formData.videourl) && !indieauthor.utils.isIndieResource(formData.videourl))
            keys.push("Video.videourl.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(formData.captions) && !indieauthor.utils.isIndieResource(formData.captions))
            keys.push("common.captions.invalid");

        if (!indieauthor.utils.isStringEmptyOrWhitespace(formData.descriptions) && !indieauthor.utils.isIndieResource(formData.descriptions))
            keys.push("common.descriptions.invalid");

        if (formData.instanceName.length == 0)
            keys.push("common.name.invalid");
        else if (!indieauthor.model.isUniqueName(formData.instanceName, instanceId))
            keys.push("common.name.notUniqueName");

        return keys;
    },
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAvCAYAAAB30kORAAAACXBIWXMAAAsSAAALEgHS3X78AAADXUlEQVRoBe2Zb0gTYRzHv7tp0bQ5wQqhzigqtIIwYpUN55v+aJCGrmhKRLLI3rg3tVFQvsitV9obXwyifBGURPUiX+yVmgSZFEGwwN7MvS3Qqe2F/y5+l7dmd+futtvdjD5w7NHd7vns4bfvc/c8JqTA2l2HADTCWKIAXsfGBqblLJLSrN3VA6Bze/kW0GEU7z9FsCLeFBsb+Cyrwdpd91i7iwuPfOCMJj47x51uu8mxdtcUa3fZ1pKeevRs0HBhARI/3niDxDulfBnW7nICsDU31Bpcyn+wFhfhZO0R+vuc1PuM0KAT84mSNXwK/v7HzNxPRCYm+XbV3gpdvkzkWxQzswlYN1tQtWdn2vNF0iR8oaOLbz/vu4uj1VW5MU2hq6efTw3qi/pMB6PsssawcUOhzRcIOX2B0KoUEY00ZbS3vSXZ1oOWBieOVe8X9WezFtNkNwRg2hcIeYN+zxNZ6c72Zl1HVkFy0Ug/9gVC0aDfM5zX5SHBZazD9ODfFI20kB50CPKpcLEfmN9xDfPWNiwFXgHxRNbSlB7UH70qQX15xL4nRZcCLzF/wIvlp6NZi6sh+/SIJ7B4PQRTXxgFD9wwnahULSGXHnJolh7cl0ks1HeDcTtg9p+HiS1T/Fm19z2apweVykLNbc3qXQqRNKUHTal0UDsj4gm+3kl++c3HtFeg9KD+6DUj6XTpoQZKmsVLvVhs6ObLR47cp0cGLI9+xULNHf4HqwW63ntQvXNuhyhhDEsPRZRYAFYsZnh6yHbkdqDw3X1VUShHzu89GEclzP6mNSedvHlyoRGlSYZGOB1qn1xE0lpAsuaOU79rOAdomh7M2cMwB1tV160h6WE6WJHxzRIySI/syqPEgoJgq6K61RLV6UGjSSVAmElWg7rVJT34H5mG/FPrHnLk9bqHKuk8XPdYxbosj//SesGsbMoIGzR5Q/jtOIosm6RHOjY2QNLDXb39mT/IasyLwRFEJqLYxZZLXlhID29kIjp0pu2W7erFekWzUi6gQQuPjPPS+3az2FpWKtlL6j4iLafSXqJTWOgzgm1lpbywTGYPB/2eumROr+yQXpE60xcIcUZ9CSmUpof8zqm+8B5Kpb15IEyV8BBKpWnLgPaqhXg0AOq/Luj3GNV/lgD4BSS0axKI6w0yAAAAAElFTkSuQmCC",
    functions: {
        toggleCaptionAndDescriptions: function (modelObject, videourl) {
            if (indieauthor.utils.isIndieResource(videourl)) {
                $('#f-' + modelObject.id + ' input[name="captions"]').parent().show();
                $('#f-' + modelObject.id + ' input[name="descriptions"]').parent().show();
            } else {
                $('#f-' + modelObject.id + ' input[name="captions"]').parent().hide();
                $('#f-' + modelObject.id + ' input[name="descriptions"]').parent().hide();

            }
        },
        putOrDeleteCaptionAndDescriptions: function (modelObject) {
            if (!indieauthor.utils.isIndieResource(modelObject.data.videourl)) {
                modelObject.data.captions = "";
                modelObject.data.descriptions = "";
            }
        }
    }
}
indieauthor.polyfill = {};

indieauthor.polyfill.allowed = {
    dataset: false
}

indieauthor.polyfill.setBrowserCapabilities = function () {
    indieauthor.polyfill.allowed.dataset = Modernizr.dataset;
}

indieauthor.polyfill.getData = function (element, dataName) {
    if (!indieauthor.polyfill.allowed.dataset) return element.getAttribute("data-" + dataName);

    return element.dataset[dataName];
}


indieauthor.polyfill.setData = function (element, dataName, dataValue) {
    if (!indieauthor.polyfill.allowed.dataset) element.setAttribute("data-" + dataName, dataValue);
    else element.dataset[dataName] = dataValue;
}

indieauthor.polyfill.deleteData = function (element, dataName) {
    if (!indieauthor.polyfill.allowed.dataset) element.removeAttribute("data-" + dataName);
    else delete element.dataset[dataName];
}

Number.isInteger = Number.isInteger || function (value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};
indieauthor.undoredo.commandArray = [];

indieauthor.undoredo.currentIndex = -1;

indieauthor.undoredo.COMMANDS_LIMIT = 10;

indieauthor.undoredo.redo = function () {
    if (this.commandArray.length == 0 || this.currentIndex == (this.commandArray.length - 1)) {
        indieauthor.utils.notifyWarning(indieauthor.strings.messages.warningMessage, indieauthor.strings.messages.noRedo);
        return;
    }

    indieauthor.undoredo.currentIndex++;

    var command = this.commandArray[this.currentIndex];
    this.actions[command.type].do(command.modelId, command.data);
}

indieauthor.undoredo.undo = function () {
    if (this.commandArray.length == 0 || this.currentIndex == -1) {
        indieauthor.utils.notifyWarning(indieauthor.strings.messages.warningMessage, indieauthor.strings.messages.noUndo);
        return;
    }

    var command = this.commandArray[this.currentIndex];
    this.actions[command.type].undo(command.modelId, command.data);

    indieauthor.undoredo.currentIndex--;
}

indieauthor.undoredo.pushCommand = function (commandType, commandModelId, commandData) {
    var command = {
        type: commandType,
        modelId: commandModelId,
        data: commandData
    };

    if (this.currentIndex < (this.commandArray.length - 1)) {
        var itemsToBDeleted = this.commandArray.length - (this.currentIndex + 1);
        this.commandArray.splice(this.currentIndex + 1, itemsToBDeleted);
    }

    this.commandArray.push(command);

    if (this.commandArray.length >= this.COMMANDS_LIMIT) this.commandArray.shift();

    this.currentIndex = this.commandArray.length - 1;
}

indieauthor.undoredo.clearCommandArray = function () {
    this.commandArray = [];
}

indieauthor.undoredo.functions = {
    removeElement: function (id) {
        indieauthor.deleteToolTipError(document.querySelector("[data-id='" + id + "']").querySelector('[data-prev]'));
        indieauthor.model.removeElement(id);
        $(document.querySelector("[data-id='" + id + "']").parentNode).remove();
    },
    removeSection: function (id) {
        indieauthor.deleteToolTipError(document.getElementById("sec-" + id).querySelector('[data-prev]'));
        indieauthor.model.removeElement(id);
        $(document.getElementById("sec-" + id).parentNode).remove();
    },
    addElement: function (view, element, parentType, parentContainerId, parentContainerIndex, inPositionElementId) {
        view = indieauthor.undoredo.utils.clearElement(view);

        var parentContainer = document.querySelector("[data-id='" + parentContainerId + "']");
        var parentElement = indieauthor.model.findObject(parentContainerId);

        var target;

        if (parentElement.type == 'layout')
            target = parentContainer.querySelector('[data-index="' + parentContainerIndex + '"');
        else
            target = (parentElement.type == 'specific-container' || parentElement.type == 'simple-container' || parentElement.type == 'specific-element-container') ? parentContainer.querySelector('[data-content]') : parentContainer.querySelector('[data-role="container"]');

        if (inPositionElementId != -1) {
            var targetItem = $(target).find('.container-item [data-id="' + inPositionElementId + '"]');
            var closestItemContent = $(targetItem).parent();
            $(closestItemContent).before(view);
        } else {
            $(target).append(view);
        }

        if (parentType == 'layout')
            indieauthor.model.appendObject(element, inPositionElementId, parentContainerId, parentContainerIndex);
        else
            indieauthor.model.appendObject(element, inPositionElementId, parentContainerId);

        this.regeneratePreview(element);

    },
    addSection: function (view, element, position) {
        view = indieauthor.undoredo.utils.clearElement(view);

        if (position == indieauthor.model.sections.length) {
            $(indieauthor.container).append(indieauthor.undoredo.utils.clearElement(view));
            indieauthor.model.sections.push(element);
        } else {
            $(view).insertBefore(indieauthor.container.children[position]);
            indieauthor.model.sections.splice(position, 0, element);
        }
    },
    moveElement: function (containerType, containerId, containerIndex, initialPosition, finalPosition) {
        var parentContainer = indieauthor.model.findObject(containerId);

        if (containerType == 'layout') {
            var initialModel = parentContainer.data[containerIndex][initialPosition];
            var finalModel = parentContainer.data[containerIndex][finalPosition];
            indieauthor.utils.array_move(parentContainer.data[containerIndex], initialPosition, finalPosition);
        } else {
            var initialModel = parentContainer.data[initialPosition];
            var finalModel = parentContainer.data[finalPosition];
            indieauthor.utils.array_move(parentContainer.data, initialPosition, finalPosition);
        }

        var initialElement = indieauthor.findElementByDataId(initialModel.id).parentNode;
        var finalElement = indieauthor.findElementByDataId(finalModel.id).parentNode;

        var action = initialPosition < finalPosition ? 'after' : 'before';
        indieauthor.undoredo.utils.move(initialElement, finalElement, action);
    },
    swapSections: function (sectionOriginId, direction) {
        var positionQuery = (direction == 1) ? $(document.getElementById("sec-" + sectionOriginId).parentNode).prev() : $(document.getElementById("sec-" + sectionOriginId).parentNode).next();

        if (positionQuery.length == 1) {
            var targetOrigin = indieauthor.polyfill.getData(positionQuery[0].firstElementChild, 'id');
            indieauthor.utils.swap(document.getElementById("sec-" + sectionOriginId).parentNode, document.getElementById("sec-" + targetOrigin).parentNode);
            indieauthor.model.swap(sectionOriginId, targetOrigin);
        }
    },
    regeneratePreview: function (element) {
        indieauthor.widgets[element.widget].preview(element);

        if (indieauthor.hasChildren(element.type)) {
            var elementsArray = element.type == 'layout' ? [].concat.apply([], element.data) : element.data;
            for (var i = 0; i < elementsArray.length; i++) {
                this.regeneratePreview(elementsArray[i]);
            }
        }
    }
}

indieauthor.undoredo.actions = {
    add: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.addElement(data.view, data.element, data.parentType, data.parentContainerId, data.parentContainerIndex, data.inPositionElementId);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.removeElement(modelId);
        },
    },
    addSection: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.addSection(data.view, data.element, data.position);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.removeSection(modelId);
        }
    },
    removeSection: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.removeSection(modelId);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.addSection(data.view, data.element, data.position);
        }
    },
    remove: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.removeElement(modelId);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.addElement(data.view, data.element, data.parentType, data.parentContainerId, data.parentContainerIndex, data.inPositionElementId);
        }
    },
    move: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.moveElement(data.containerType, data.containerId, data.containerIndex, data.initialPosition, data.finalPosition);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.moveElement(data.containerType, data.containerId, data.containerIndex, data.finalPosition, data.initialPosition);
        }
    },
    swapSection: {
        do: function (data) {
            indieauthor.undoredo.functions.swapSections(data.sectionOriginId, data.direction);
        },
        undo: function (data) {
            var oppositeDirection = (data.direction == 1) ? 0 : 1;
            indieauthor.undoredo.functions.swapSections(data.sectionOriginId, oppositeDirection);
        }
    },
    moveContainer: {
        do: function (modelId, data) {
            indieauthor.undoredo.functions.removeElement(modelId, data.element);

            var targetParent = indieauthor.model.findObject(data.target.id);
            var inPosition;
            var elementsArray = (targetParent.type == 'layout') ? targetParent.data[data.target.index] : targetParent.data;

            if (data.target.position == -1 || elementsArray.length == 0)
                inPosition = -1;
            else if (data.target.position < elementsArray.length)
                inPosition = elementsArray[data.target.position].id;
            else
                inPosition = elementsArray[elementsArray.length - 1].id;

            indieauthor.undoredo.functions.addElement(data.view, data.element, undefined, data.target.type, data.target.id, data.target.index, inPosition);
        },
        undo: function (modelId, data) {
            indieauthor.undoredo.functions.removeElement(modelId, data.element);

            var sourceParent = indieauthor.model.findObject(data.source.id);
            var inPosition;
            var elementsArray = (sourceParent.type == 'layout') ? sourceParent.data[data.source.index] : sourceParent.data;

            if (data.source.position == -1 || elementsArray.length == 0)
                inPosition = -1;
            else if (data.source.position < elementsArray.length)
                inPosition = elementsArray[data.source.position].id;
            else
                inPosition = elementsArray[elementsArray.length - 1].id;

            indieauthor.undoredo.functions.addElement(data.view, data.element, undefined, data.source.type, data.source.id, data.source.index, inPosition);
        }
    }
}

indieauthor.undoredo.utils = {
    clearElement: function (elementString) {
        return elementString.replace('gu-transit', '');
    },
    move: function (e1, e2, mode) {
        if (mode == 'before') {
            $(e1).insertBefore(e2);
        } else if (mode == 'after') {
            $(e1).insertAfter(e2);
        }
    }
}
indieauthor.api.editorFunctions = {};

indieauthor.api.editorFunctions.getEditorContent = function (onSuccess, onError) {
    if (indieauthor.api.validateContent(false)) {
        var sections = indieauthor.model.sections;
        onSuccess(sections);
    } else {
        onError(indieauthor.strings.messages.contentErrors);
    }
}

indieauthor.api.editorFunctions.loadModelIntoPlugin = function (model, onLoaded, onError) {
    try {
        var sections = model.sections;

        $(indieauthor.container).toggle(1000, function () {
            $(indieauthor.container).empty();
            indieauthor.model.sections = sections;

            for (var i = 0; i < indieauthor.model.sections.length; i++) {
                var element = indieauthor.model.sections[i];
                indieauthor.loadElement(indieauthor.container, element, true);
            }

            $(indieauthor.container).toggle(1000, function () {
                onLoaded();
            });
        })
    } catch (err) {
        $(indieauthor.container).empty();
        indieauthor.model.sections = [];
        onError(err);
    }
}

indieauthor.api.getEditorContent = function (onSuccess, onError) {
    if (indieauthor.api.validateContent(false)) {
        var sections = indieauthor.model.sections;
        var version = indieauthor.model.CURRENT_MODEL_VERSION;
        onSuccess(sections, version);
    } else {
        onError(indieauthor.strings.messages.contentErrors);
    }
}

indieauthor.api.validateContent = function (print) {
    var currentErrors = indieauthor.model.currentErrors;
    var newErrors = indieauthor.model.validate();
    indieauthor.showErrors(currentErrors, newErrors);

    if (indieauthor.model.sections.length == 0) {
        if (print) indieauthor.utils.notifyError(indieauthor.strings.messages.errorMessage, indieauthor.strings.messages.emptyContent);
        return false;
    } else if (newErrors.length == 0) {
        if (print) indieauthor.utils.notifiySuccess(indieauthor.strings.messages.successMessage, indieauthor.strings.messages.noErrors);
        return true;
    } else {
        if (print) indieauthor.utils.notifyError(indieauthor.strings.messages.errorMessage, indieauthor.strings.messages.contentErrors);
        return false;
    }
}

indieauthor.api.clearContent = function () {
    bootprompt.confirm({
        title: indieauthor.strings.general.areYouSure,
        message: indieauthor.strings.messages.confirmClearContent,
        buttons: {
            confirm: {
                label: indieauthor.strings.general.delete,
                className: 'btn-danger'
            },
            cancel: {
                label: indieauthor.strings.general.cancel,
                className: 'btn-indie'
            }
        },
        callback: function (result) {
            if (result) {
                $(indieauthor.container).children().fadeOut(500, function () {
                    $(indieauthor.container).empty();
                    indieauthor.utils.notifiySuccess(indieauthor.strings.messages.successMessage, indieauthor.strings.messages.contentCleared);
                    indieauthor.model.sections = [];
                });
            }
        },
        closeButton: false,
    });
}

indieauthor.api.loadModelIntoPlugin = function (model, onLoaded, onError) {
    try {
        var sections = model.sections;
        $(indieauthor.container).toggle(1000, function () {
            $(indieauthor.container).empty();
            indieauthor.model.sections = sections;

            for (var i = 0; i < indieauthor.model.sections.length; i++) {
                var element = indieauthor.model.sections[i];
                indieauthor.loadElement(indieauthor.container, element, true);
            }

            $(indieauthor.container).toggle(1000, function () {
                onLoaded();
            });
        })
    } catch (err) {
        $(indieauthor.container).empty();
        indieauthor.model.sections = [];
        onError(err);
    }
}

indieauthor.api.undo = function () {
    indieauthor.undoredo.undo();
}

indieauthor.api.redo = function () {
    indieauthor.undoredo.redo();
}


indieauthor.api.editorFunctions.getEditorContent = function (onSuccess, onError) {
    if (indieauthor.api.validateContent(false)) {
        var sections = indieauthor.model.sections;
        onSuccess(sections);
    } else {
        onError(indieauthor.strings.messages.contentErrors);
    }
}

indieauthor.api.editorFunctions.loadModelIntoPlugin = function (model, onLoaded, onError) {
    try {
        var sections = model.sections;

        $(indieauthor.container).toggle(1000, function () {
            $(indieauthor.container).empty();
            indieauthor.model.sections = sections;

            for (var i = 0; i < indieauthor.model.sections.length; i++) {
                var element = indieauthor.model.sections[i];
                indieauthor.loadElement(indieauthor.container, element, true);
            }

            $(indieauthor.container).toggle(1000, function () {
                onLoaded();
            });
        })
    } catch (err) {
        $(indieauthor.container).empty();
        indieauthor.model.sections = [];
        onError(err);
    }
}
indieauthor.utils = {};

indieauthor.utils.generate_uuid = (function () {
    var s4 = function () {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    return function () {
        return s4() + s4() + s4();
    };
})();

indieauthor.utils.contains = function (a, b) {
    return a.contains ?
        a != b && a.contains(b) :
        !!(a.compareDocumentPosition(b) & 16);
}

indieauthor.utils.isStringEmptyOrWhitespace = function (str) {
    return str === null || str.match(/^ *$/) !== null;
}

indieauthor.utils.toJSON = function (form) {
    var obj = {};
    var elements = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < elements.length; ++i) {
        var element = elements[i];
        var name = element.name;
        var value = element.value;
        var type = element.type;

        let matchedArray = name.match(/^([^[]*)\[(\d+)\](?:\[([^\]]+)\])?$/);
        if (matchedArray)
        {
            let field = matchedArray[1];
            let position = matchedArray[2];
            let subField = matchedArray.length > 3 ? matchedArray[3] : null;
            if (!obj[field]) obj[field] = [];
            if (subField) {
                if (!obj[field][position]) obj[field][position] = {};
                if (type != 'radio' || element.checked)
                    obj[field][position][subField] = value;
            } else 
                if (type != 'radio' || element.checked)
                    obj[field][position] = value;
        }
        else {
            if (name && (type != 'radio' || element.checked))
                obj[name] = value;
        }
    }

    return obj;
}

indieauthor.utils.notifiySuccess = function (title, message) {
    toastr.success(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}

indieauthor.utils.notifyError = function (title, message) {
    toastr.error(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}

indieauthor.utils.notifyWarning = function (title, message) {
    toastr.warning(message, title, {
        timeOut: 5000,
        positionClass: "toast-bottom-right"
    });
}


indieauthor.utils.stringIsInArray = function (string, arrayStrings) {
    return (arrayStrings.indexOf(string) > -1);
}

indieauthor.utils.clearDataAttributes = function (element) {
    $.each($(element).data(), function (i) {
        $(element).removeAttr("data-" + i);
    });
}

indieauthor.utils.isEmpty = function (obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

indieauthor.utils.parseBoolean = function (string) {
    var bool;
    bool = (function () {
        switch (false) {
            case string.toLowerCase() !== 'true':
                return true;
            case string.toLowerCase() !== 'false':
                return false;
        }
    })();

    if (typeof bool === "boolean") {
        return bool;
    }

    return void 0;
};

indieauthor.utils.booleanToString = function (bool) {
    if (bool === true) {
        return "true"
    } else if (bool === false) {
        return "false";
    }
}

indieauthor.utils.findIndexObjectInArray = function (array, key, value) {
    for (var i = 0; i < array.length; i++) {
        var element = array[i];
        if (element[key] == value)
            return i;
    }

    return -1;
}

indieauthor.utils.findObjectInArray = function (array, key, value) {
    var index = indieauthor.utils.findIndexObjectInArray(array, key, value);
    if (index != -1)
        return array[index];
    return undefined;
}

indieauthor.utils.array_move = function (arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
}


indieauthor.utils.swap = function (elementOrigin, elementTarget) {
    var div1 = $(elementOrigin);
    var div2 = $(elementTarget);

    var tdiv1 = div1.clone();
    var tdiv2 = div2.clone();

    if (!div2.is(':empty')) {
        div1.replaceWith(tdiv2);
        div2.replaceWith(tdiv1);
    }
}

indieauthor.utils.isURL = function (st) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    return regex.test(st);
}

indieauthor.utils.isYoutubeVideoURL = function (url) {
    var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

    if (url.match(p)) {
        return url.match(p)[1];
    }

    return false;
}

indieauthor.utils.isUrlWithinDomains = function (url, allowedDomains) {
    if (!indieauthor.utils.isURL(url))
        return false;

    for (var i = 0; i < allowedDomains.length; i++) {
        var allowedDomain = allowedDomains[i];
        if (url.startsWith(allowedDomain))
            return true;
    }

    return false;
}

indieauthor.utils.isIndieResource = function (url) {
    return indieauthor.utils.isUrlWithinDomains(url, ["https://my_domain1", "http://my_domain2", "https://my_domain3"]);
}

indieauthor.utils.isOnlyOneWord = function (string) {
    if (!string) return false;

    string = string.trim();
    var splited = string.split(" ");

    return (splited.length == 1);
}

indieauthor.utils.getNumber = function (number) {
    return number;
}

indieauthor.utils.hasNameInParams = function (widgetInstance) {
    return (widgetInstance.params && (widgetInstance.params.name && (widgetInstance.params.name.length > 0)))
}

indieauthor.utils.isInteractiveVideo = function (url) {
    return indieauthor.utils.isUrlWithinDomains(url, ["https://my_domain1", "https://my_domain2", "https://my_domain3"]);
}

indieauthor.utils.getAllUrlParams = function (url) {
    var queryString = url.split('?')[1];

    var obj = {};

    if (queryString) {

        queryString = queryString.split('#')[0];

        var arr = queryString.split('&');

        for (var i = 0; i < arr.length; i++) {
            var a = arr[i].split('=');

            var paramName = a[0];
            var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

            paramName = paramName.toLowerCase();
            if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

            if (paramName.match(/\[(\d+)?\]$/)) {

                var key = paramName.replace(/\[(\d+)?\]/, '');
                if (!obj[key]) obj[key] = [];

                if (paramName.match(/\[\d+\]$/)) {
                    var index = /\[(\d+)\]/.exec(paramName)[1];
                    obj[key][index] = paramValue;
                } else {
                    obj[key].push(paramValue);
                }
            } else {
                if (!obj[paramName]) {
                    obj[paramName] = paramValue;
                } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                    obj[paramName] = [obj[paramName]];
                    obj[paramName].push(paramValue);
                } else {
                    obj[paramName].push(paramValue);
                }
            }
        }
    }

    return obj;
}