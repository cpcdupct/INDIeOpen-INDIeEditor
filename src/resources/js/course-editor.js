

/**
 * Course editor and viewer: version 0.0.1
 *
 * @param {*} elementId DOCM element ID
 * @param {*} pluginOptions Plugin options
 */
const courseEditor = function (elementId, pluginOptions) {
    /** DOM Editor Container instance */
    let editorContainer;

    /** Drawflow editor instance */
    let editorInstance;

    /** Available content/evaluation units for the editor */
    let availableUnits = [];

    /** Grade rules */
    const rules = [];

    /** Association between drawflow nodes IDs and content/evaluation units */
    const unitNodes = [];

    const lang = {
        es: {
            content: "Contenido",
            evaluation: "Evaluación",
            completed: "Completado: "
        },
        en: {
            content: "Content",
            evaluation: "Evaluation",
            completed: "Completed: "
        }
    }

    /**
     * Initialize the course editor
     *
     * @param {*} id DOM Element ID in the document
     * @param {*} _options Plugin options
     */
    function init(id, _options) {
        // DOM Container instance
        editorContainer = document.getElementById(id);
        if (!editorContainer)
            throw new Error(`No container defined by the selector #${id} was found`);

        // Drawflow editor instance
        editorInstance = new Drawflow(editorContainer);

        // Configure the editor
        configureEditor();

        // Bind needed events
        bindEvents();

        // Start the drawing
        editorInstance.start();

        // Options
        if (_options) setOptions(_options);

        // unlcok 
        unlock();
    }

    /**
     * Set the plugin data from the options
     *
     * @param {*} _options Plugin options object
     */
    function setOptions(_options) {
        if (_options.hasOwnProperty('units')) {
            availableUnits = _options.units;
        }
    }

    /**
     * Configure the draflow instance
     */
    function configureEditor() {
        // Editor instance configuration
        editorInstance.reroute = true;
        editorInstance.reroute_fix_curvature = true;
        editorInstance.force_first_input = false;

        // Create the arrow path function needed to create arrows in connections
        createArrowPath();
    }

    /**
     * Creates and associates a function to the Drawflow editor to draw arrows to connect from an origin node to a destiny node
     */
    function createArrowPath() {
        editorInstance.createCurvature = function (
            start_pos_x,
            start_pos_y,
            end_pos_x,
            end_pos_y,
            curvature_value,
            type
        ) {
            const line_x = start_pos_x;
            const line_y = start_pos_y;
            const x = end_pos_x;
            const y = end_pos_y;
            const curvature = curvature_value;
            let hx1;
            let hx2;

            switch (type) {
                case 'open':
                    if (start_pos_x >= end_pos_x) {
                        hx1 = line_x + Math.abs(x - line_x) * curvature;
                        hx2 = x - Math.abs(x - line_x) * (curvature * -1);
                    } else {
                        hx1 = line_x + Math.abs(x - line_x) * curvature;
                        hx2 = x - Math.abs(x - line_x) * curvature;
                    }

                    return (
                        ' M ' +
                        line_x +
                        ' ' +
                        line_y +
                        ' C ' +
                        hx1 +
                        ' ' +
                        line_y +
                        ' ' +
                        hx2 +
                        ' ' +
                        y +
                        ' ' +
                        x +
                        '  ' +
                        y
                    );
                case 'close':
                    if (start_pos_x >= end_pos_x) {
                        hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
                        hx2 = x - Math.abs(x - line_x) * curvature;
                    } else {
                        hx1 = line_x + Math.abs(x - line_x) * curvature;
                        hx2 = x - Math.abs(x - line_x) * curvature;
                    } //M0 75H10L5 80L0 75Z

                    return (
                        ' M ' +
                        line_x +
                        ' ' +
                        line_y +
                        ' C ' +
                        hx1 +
                        ' ' +
                        line_y +
                        ' ' +
                        hx2 +
                        ' ' +
                        y +
                        ' ' +
                        x +
                        '  ' +
                        y +
                        ' M ' +
                        (x - 11) +
                        ' ' +
                        y +
                        ' L' +
                        (x - 20) +
                        ' ' +
                        (y - 5) +
                        '  L' +
                        (x - 20) +
                        ' ' +
                        (y + 5) +
                        'Z'
                    );
                case 'other':
                    if (start_pos_x >= end_pos_x) {
                        hx1 = line_x + Math.abs(x - line_x) * (curvature * -1);
                        hx2 = x - Math.abs(x - line_x) * (curvature * -1);
                    } else {
                        hx1 = line_x + Math.abs(x - line_x) * curvature;
                        hx2 = x - Math.abs(x - line_x) * curvature;
                    }
                    return (
                        ' M ' +
                        line_x +
                        ' ' +
                        line_y +
                        ' C ' +
                        hx1 +
                        ' ' +
                        line_y +
                        ' ' +
                        hx2 +
                        ' ' +
                        y +
                        ' ' +
                        x +
                        '  ' +
                        y
                    );
                default:
                    hx1 = line_x + Math.abs(x - line_x) * curvature;
                    hx2 = x - Math.abs(x - line_x) * curvature;

                    return (
                        ' M ' +
                        line_x +
                        ' ' +
                        line_y +
                        ' C ' +
                        hx1 +
                        ' ' +
                        line_y +
                        ' ' +
                        hx2 +
                        ' ' +
                        y +
                        ' ' +
                        x +
                        '  ' +
                        y +
                        ' M ' +
                        (x - 11) +
                        ' ' +
                        y +
                        ' L' +
                        (x - 20) +
                        ' ' +
                        (y - 5) +
                        '  L' +
                        (x - 20) +
                        ' ' +
                        (y + 5) +
                        'Z'
                    );
            }
        };
    }

    /**
     * Bind needed editor events for connection handling
     */
    function bindEvents() {
        // Connection created
        editorInstance.on('connectionCreated', handleConnectionCreated);

        // Connection removed
        editorInstance.on('connectionRemoved', deletedConnectionRule);

        // Node removed
        editorInstance.on('nodeRemoved', handleNodeRemoved);
    }

    function handleConnectionCreated(connection) {
        const originNode = unitNodes.find(un => un.node === connection.output_id);
        if (originNode.unit.type === 'EVALUATION')
            openRuleModal('create', connection);
        else
            createandAppendConnectionRule(connection, { operator: 'eq', grade: 10 }, false);
    }

    function handleNodeRemoved(nodeId) {
        const unitNodeIndex = unitNodes.findIndex(un => un.node === nodeId);

        if (unitNodeIndex !== -1) {
            unitNodes.splice(unitNodeIndex, 1);
        }
    }

    /**
     * Method that handles the connectionCreated event. A modal for creating the rule for the connection is shown to the user.
     * The user must introduce the correct data. If the user dismisses the modal, the connection must be removed. If the user
     * introduces correct data, a rule must be created.
     *
     * @param {*} connection Created connection
     */
    function openRuleModal(mode, connection, rule) {
        // Function references to create connection and update rule
        const createConnectionRef = createandAppendConnectionRule;
        const updateRuleref = updateRule;

        /** jQuery form validator instance */
        let formValidator;

        // Show modal
        $('#modal-rule').modal(modalOptionsShow);

        // Update form while showing the modal if the mode is edit
        if (mode === 'edit') {
            $('#operator').val(rule.operator);
            $('#grade').val(rule.grade);
        }

        // Creates a form validator using jquery-validate
        $('#modal-rule').on('shown.bs.modal', function () {
            formValidator = $('#rule-form').validate({
                rules: {
                    operator: {
                        required: true
                    },
                    grade: {
                        required: true,
                        min: 1,
                        max: 10
                    }
                }
            });
        });

        // Remove all event listeners and reset the form
        $('#modal-rule').on('hidden.bs.modal', function () {
            $('#rule-form').trigger('reset');
            formValidator.resetForm();
            $('#modal-rule button[data-action="dismiss"]').off('click');
            $('#rule-form').off('submit');
            $('#modal-rule').modal('dispose');
        });

        // In case of dismissed, the connection must be removed from the drawflow instance
        $('#modal-rule button[data-action="dismiss"]').on('click', function (e) {
            e.preventDefault();

            // If mode is create, we need to the remove the connection already created with drawflow
            if (mode === 'create') {
                editorInstance.removeSingleConnection(
                    connection.output_id,
                    connection.input_id,
                    connection.output_class,
                    connection.input_class
                );
            }

            $('#modal-rule').modal('hide');
        });

        // If the form is valid, then create the rule
        $('#rule-form').on('submit', function (e) {
            e.preventDefault();
            if ($('#rule-form').valid()) {
                const ruleData = getFormData($('#rule-form'));

                if (mode === 'create') createConnectionRef(connection, ruleData);
                else {
                    rule.grade = parseInt(ruleData.grade);
                    rule.operator = ruleData.operator;
                    updateRuleref(rule);
                }

                $('#modal-rule').modal('hide');
            }
        });
    }

    /**
     * Serializes the form data into an object from a DOM form element
     *
     * @param {*} form DOM Form element to serialize
     */
    function getFormData(form) {
        const unindexed_array = form.serializeArray();
        let indexed_array = {};

        $.map(unindexed_array, function (n, i) {
            indexed_array[n['name']] = n['value'];
        });

        return indexed_array;
    }

    /**
     * Update an existing rule in the rules array
     *
     * @param {*} rule Rule to be updated
     */
    function updateRule(rule) {
        const existingRule = rules.find(r => r.id === rule.id);

        if (existingRule) {
            existingRule.grade = rule.grade;
            existingRule.operator = rule.operator;
            updateDrawing(rule);
        }
    }

    /**
     * Creates a rule given a connection and draws it in the editor
     *
     * @param {*} connection Connection object from the drawflow editor
     * @param {*} rule_data Rule data
     */
    function createandAppendConnectionRule(connection, rule_data, draw = true) {
        // Create rule
        const rule = {};
        rule.node_in = connection.input_id;
        rule.node_out = connection.output_id;
        rule.operator = rule_data.operator;
        rule.grade = parseInt(rule_data.grade);
        rule.id = randomId();

        rules.push(rule);

        // Draw the connection with the rule grade
        if (draw)
            drawConnectionWithRule(connection, rule);
    }

    /**
     * Draw a rule in a connection. Creates a SVG textData and textPath and appends it into the svg connection element
     *
     * @param {*} connection Connection object
     * @param {*} rule Rule data
     */
    function drawConnectionWithRule(connection, rule) {
        // Get the SVG element and append an id
        const svgElement = document.querySelector(
            `svg.connection.node_in_node-${connection.input_id}.node_out_node-${connection.output_id}`
        );
        svgElement.setAttribute('id', 'svg-' + rule.id);

        // Get the svg PATH element
        const pathElement = svgElement.querySelector('path');
        pathElement.setAttribute('id', `p-${rule.id}`);

        // Create the text element
        const textelement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textelement.classList.add('main-path');
        textelement.classList.add('connection-text');
        textelement.setAttribute('dy', '-12');
        textelement.addEventListener('click', function (e) {
            e.preventDefault();
            openRuleModal('edit', connection, rule);
        });

        // Create the textPath element pointing to the path elenet
        const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
        textPath.setAttribute('href', `#p-${rule.id}`);
        textPath.setAttribute('startOffset', '50%');
        textPath.innerHTML = '&' + rule.operator + '; ' + rule.grade;

        // Append to the text element
        textelement.appendChild(textPath);

        // Append to the svg
        svgElement.appendChild(textelement);
    }

    /**
     * From an existing rule connection in the editor, updates the svg text element with the operator and grade from the update rule
     *
     * @param {*} rule update rule data
     */
    function updateDrawing(rule) {
        const svgElement = document.querySelector(`#svg-${rule.id}`);

        const textPath = svgElement.querySelector('textPath');
        textPath.innerHTML = '&' + rule.operator + '; ' + rule.grade;
    }

    /** Delete a rule associated with a connection */
    function deletedConnectionRule(connection) {
        const rule = rules.find(
            r => r.node_in === connection.input_id && r.node_out === connection.output_id
        );

        if (rule) {
            const index = rules.indexOf(rule);
            rules.splice(index, 1);
        }
    }

    /**
     * Drag event that puts the data-node attribute into the data transfer ov an event
     *
     * @param {*} ev Drag event
     */
    function drag(ev) {
        ev.dataTransfer.setData('node', ev.target.getAttribute('data-node'));
    }

    /**
     * Drop event that adds a node to the drawflow given a unit from the data node.
     *
     * @param {*} ev Drop event
     */
    function drop(ev) {
        ev.preventDefault();
        const data = ev.dataTransfer.getData('node');
        const unit = findUnitbyId(data);
        addNodeToDrawFlow(ev.clientX, ev.clientY, unit);
    }

    /**
     * Add a node to the drawflow editor in a position with a unit information.
     *
     * @param {*} pos_x X axis
     * @param {*} pos_y Y axis
     * @param {*} unit Unit instance
     */
    function addNodeToDrawFlow(pos_x, pos_y, unit) {
        if (editorInstance.editor_mode === 'fixed') {
            return false;
        }

        const x =
            pos_x *
            (editorInstance.precanvas.clientWidth /
                (editorInstance.precanvas.clientWidth * editorInstance.zoom)) -
            editorInstance.precanvas.getBoundingClientRect().x *
            (editorInstance.precanvas.clientWidth /
                (editorInstance.precanvas.clientWidth * editorInstance.zoom));
        const y =
            pos_y *
            (editorInstance.precanvas.clientHeight /
                (editorInstance.precanvas.clientHeight * editorInstance.zoom)) -
            editorInstance.precanvas.getBoundingClientRect().y *
            (editorInstance.precanvas.clientHeight /
                (editorInstance.precanvas.clientHeight * editorInstance.zoom));

        const rendered = renderUnitBox(unit);
        const nodeAdded = editorInstance.addNode(unit.id, 1, 1, x, y, 'box', {}, rendered);

        unitNodes.push({
            node: nodeAdded.toString(),
            unit: unit
        });
    }

    /**
     * Render the HTML content that a 'unit box' needs in order to be inserted into the editor as drawflow node
     *
     * @param {*} unit Unit instance
     */
    function renderUnitBox(unit) {
        return `
                <div data-unitid="${unit.id}">
                    <div class="title-box">
                        <i class="fas fa-book"></i> ${unit.name}
                    </div>
                    <div class="box">
                        <div class="image-wrapper">
                            <img draggable="false" src="${unit.cover}"/>
                        </div>
                        <div class="unit">
                            <div class="unit-name">
                                <h6>${unit.name}</h6>
                            </div>
                            <div class="unit-badge">
                                <span class="badge badge-${unit.type.toLowerCase()}">${lang[getBrowserLang()][unit.type.toLowerCase()]}</span>
                            </div>
                            <div class="unit-description">
                                <p>${unit.description}</p>
                            </div>
                            <a class="my-2 btn btn-block btn-primary" href="${unit.link}" target="_blank"><i class="fas fa-link"></i></a>
                        </div>
                    </div>
                </div>
        `;
    }

    function getBrowserLang() {
        if (window.navigator.language === 'es' || window.navigator.language === 'en')
            return window.navigator.language;
        else return 'en';
    }

    /**
     * Allow drop event
     *
     * @param {*} ev Event
     */
    function allowDrop(ev) {
        ev.preventDefault();
    }

    /**
     * Finds a unit by its id in available units or usedUnits
     *
     * @param {*} id Unit id
     */
    function findUnitbyId(id) {
        // In available
        const availableUnit = availableUnits.find(u => u.id === id);
        if (availableUnit) return availableUnit;

        // In unitNodes
        const usedUnit = unitNodes.find(un => un.unit.id === id);
        if (usedUnit) return usedUnit;

        throw new Error(`Unit with id:${id} not found`);
    }

    /**
     * Export the editor data: Drawflow data, rules and unitNodes
     */
    function exportData() {
        const data = editorInstance.export();

        data.rules = rules;
        data.unitNodes = unitNodes;

        return data;
    }

    /**
     * Import the editor data
     *
     * @param {*} data Editor data
     */
    function importEditorData(data, viewOnly) {
        // Populate the unitNodes variable
        data.unitNodes.forEach((un) => {
            unitNodes.push(un)
        });

        // Load drawflow data
        editorInstance.import(data);

        // Draw
        if (!viewOnly)
            for (let index = 0; index < data.rules.length; index++) {
                const rule = data.rules[index];
                rules.push(rule);
                if (rule.operator === 'eq' && rule.grade === 10) continue;
                drawConnectionWithRule({ input_id: rule.node_in, output_id: rule.node_out }, rule);
            }
    }

    /**
     * Returns wether a rule is applied given a grade value.
     *
     * @param {*} rule Rule data
     * @param {*} gradeValue Grade value
     */
    function isRuleApplied(rule, gradeValue) {
        const functionByOpeartor = getFunctionByOperator(rule.operator);
        return functionByOpeartor(gradeValue, rule.grade);
    }

    /**
     * Returns a function to by applied given a operator
     *
     * @param {*} operator Rule opreator
     */
    function getFunctionByOperator(operator) {
        switch (operator) {
            case 'le':
                return (a, b) => a <= b;
            case 'lt':
                return (a, b) => a < b;
            case 'ge':
                return (a, b) => a >= b;
            case 'gt':
                return (a, b) => a > b;
            case 'eq':
                return (a, b) => a === b;
        }
    }

    /**
     * Create an only-view instance of the editor intended to be used only in a course. Given a student grades, draw the portion of the drawflow editor
     * that applies to the grade rules set in the editor data
     *
     * @param {*} editorData Editor data
     * @param {*} grades Grades of the student
     */
    function createOnlyViewEditorInstance(editorData, grades) {
        const data = Object.assign({}, editorData);

        /** Rules to be drawn in the editor */
        let rulesToDraw = [];

        /** Set of nodes to draw */
        const nodesToDrawSet = new Set();

        // Iterate over the grades to select the rules
        for (let i = 0; i < grades.length; i++) {
            const grade = grades[i];

            // Obtain nodes that the student's grade has correlation
            const nodesWithUnit = data.unitNodes
                .filter(un => un.unit.id === grade.unitid)
                .map(un => un.node);

            // Obtain rules that has as output node the node that applies by the grade
            const appliedRulesByGrade = data.rules.filter(
                rule => nodesWithUnit.includes(rule.node_out) && isRuleApplied(rule, grade.value)
            );

            // Append rules
            rulesToDraw = rulesToDraw.concat(appliedRulesByGrade);
        }

        // Add each node from the connection (in and out) to the set
        rulesToDraw.forEach(rule => {
            nodesToDrawSet.add(rule.node_in);
            nodesToDrawSet.add(rule.node_out);
        });

        // Add starting nodes to the nodes to draw set. A starting node is a node which does not have any input connection
        Object.keys(data.drawflow.Home.data).forEach(node => {
            const dData = data.drawflow.Home.data[node];
            // There is only ony possible input
            if (dData.inputs.input_1.connections.length == 0) nodesToDrawSet.add(node);
        });

        // Get an array from the set
        const nodesToDraw = Array.from(nodesToDrawSet);

        // Detel nodes from model
        const nodeIndexesToBedeleted = Object.keys(data.drawflow.Home.data).filter(
            k => !nodesToDraw.includes(k)
        );

        nodeIndexesToBedeleted.map(node => delete data.drawflow.Home.data[node]);

        // Assign rules
        data.rules = rulesToDraw;

        // Import the modified data
        importEditorData(data, true);

        // Draw percentage of the student
        drawGradesPercentage(grades)

        // Lock the editor
        lock();
    }

    /**
     * Draw grade percentages based on the student's grades
     *  
     * @param {[]} grades Student's grades array 
     */
    function drawGradesPercentage(grades) {
        for (const grade of grades) {
            const unit = unitNodes.find(un => un.unit.id === grade.unitid).unit;
            const gradeHtmlElement = getGradeHtml(grade, unit);
            const unitWrapperElements = document.querySelectorAll(`[data-unitid="${unit.id}"]`);

            for (let i = 0; i < unitWrapperElements.length; i++) {
                const unitWrapperElement = unitWrapperElements[i];
                const descriptionWrapper = unitWrapperElement.querySelector('.box .unit .unit-description');
                descriptionWrapper.prepend(gradeHtmlElement);
            }
        }
    }

    /**
     * Get the HTML element that indicates the percentage of complete for a student in a unit
     * 
     * @param {*} grade Student's grade 
     * @param {*} unit Unit
     */
    function getGradeHtml(grade, unit) {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = `${lang[getBrowserLang()].completed} <span><strong>${grade.value * 10}%</strong></span>`;

        if (unit.type === 'CONTENT') {
            if (grade.value === 10)
                paragraph.style = 'color:green';
            else paragraph.style = 'color:red';
        } else {
            const potentialRules = getRulesAppliedToUnit(unit.id);
            if (potentialRules.some(rule => isRuleApplied(rule, grade.value)))
                paragraph.style = 'color:green';
            else
                paragraph.style = 'color:red';
        }

        return paragraph;
    }

    /**
     * Get an array of rules that the unit is node out 
     * 
     * @param {*} unitId Unit id 
     */
    function getRulesAppliedToUnit(unitId) {
        const nodeUnit = unitNodes.filter(un => un.unit.id === unitId);
        return rules.filter(r => r.node_out === nodeUnit.node);
    }

    /**
     * clear the module instance
     */
    function clearModuleSelected() {
        editorInstance.clearModuleSelected();
    }

    /**
     * Locks the editor
     */
    function lock() {
        editorInstance.editor_mode = 'fixed';
        if (document.getElementById('lock') != undefined) {
            document.getElementById('lock').style.display = 'none';
            document.getElementById('unlock').style.display = 'block';
        }
    }

    /**
     * Unlocks the editor
     */
    function unlock() {
        editorInstance.editor_mode = 'edit';
        if (document.getElementById('lock') != undefined) {
            document.getElementById('lock').style.display = 'block';
            document.getElementById('unlock').style.display = 'none';
        }
    }

    /**
     * Creates a random id
     */
    function randomId() {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    /**
     * Zoom out the editor
     */
    function zoom_out() {
        editorInstance.zoom_out();
    }

    /**
     * Reset the editor zoom to default
     */
    function zoom_reset() {
        editorInstance.zoom_reset();
    }

    /**
     * Zoom in the editor
     */
    function zoom_in() {
        editorInstance.zoom_in();
    }

    /** Calls the plugin initialization  */
    init(elementId, pluginOptions);

    /**
     * module functions
     */
    return {
        drag: drag,
        drop: drop,
        allowDrop: allowDrop,
        exportData: exportData,
        importEditorData: importEditorData,
        clearModuleSelected: clearModuleSelected,
        lock: lock,
        unlock: unlock,
        zoom_out: zoom_out,
        zoom_reset: zoom_reset,
        zoom_in: zoom_in,
        loadViewData: createOnlyViewEditorInstance
    };
};
