define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'notebook/js/outputarea'
], function (
    $,
    Jupyter,
    events,
    outputarea,
) {
    let parameters = {
        "tracking": true,
        "aggravation": 15000 //TODO (optional) custom aggravation
    }

    //Tracking functionality
    let Tracking = function() {
        let temp_data = { //TODO get from metadata
        "filename": Jupyter.notebook.notebook_name,
        "timestamp": Date.now(),
        "total_time": 0,
        "click": 0,
        "mousemove": 0,
        "keydown": 0,
        "scroll": 0, //TODO
        "copy": 0,
        "paste": 0,
        "executes": 0,
        "markdown_renders": 0,
        "cell_create": 0,
        "cell_delete": 0,
        "errors": 0,
        };

        let i = -1;
        let data_points = (60000 / parameters.aggravation);
        let data_collection = [temp_data,{},{},{}];

        $(events).on('create.Cell delete.Cell rendered.MarkdownCell execute.CodeCell output_added.OutputArea', function(event, output) {
            if (parameters.tracking){
                if (event.type == 'create') {temp_data.cell_create++;}
                else if (event.type == 'delete') {temp_data.cell_delete++;}
                else if (event.type == 'rendered') {temp_data.markdown_renders++;}
                else if (event.type == 'execute') {temp_data.executes++;}
                else if (event.type == 'output_added') {
                    if (output.output.output_type == "error"){
                        temp_data.errors++;
                        prepare_payload(data_collection);
                    }
                }
            }
        });

        $(document).on('click mousemove keydown copy paste delete.Cell', function(event) {
            if (parameters.tracking){
                if (event.type == 'click'){temp_data.click++;}
                else if (event.type == 'mousemove') {temp_data.mousemove++;}
                else if (event.type == 'keydown') {temp_data.keydown++;}
                else if (event.type == 'copy') {temp_data.copy++;}
                else if (event.type == 'paste') {temp_data.paste++;}
            }
        });

        setInterval(function () {
            if (!document.hidden && parameters.tracking) {temp_data.total_time += 1000;}
        }, 1000);

        prepare_payload(data_collection);

        setInterval(function () {
            temp_data.filename = Jupyter.notebook.notebook_name;
            temp_data.timestamp = Date.now();
            i++;
            console.log(i);
            if (i >= data_points){
                i = 0;
                prepare_payload(data_collection);
                data_collection = [{},{},{},{}];
            };
            data_collection[i] = Object.assign({}, temp_data);
        }, parameters.aggravation);
    };

    //prepare packet for server transfer
    let prepare_payload = function(data) {
        let notebook_snapshot = {};
        if (!parameters.tracking) {
            notebook_snapshot = {"tracking":"disabled"};
        } else {
            notebook_snapshot = Jupyter.notebook.toJSON()
        };
        let packet = {
            "data":data,
            "notebook":notebook_snapshot,
            "user":"na" //TODO
        };
        send_notebook(packet);
    }


    // Send packet to server
    let send_notebook = function(packet) {
        $.ajax({
            url: 'http://127.0.0.1:5000/add',
            type: "POST",
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify(packet),
            success: function() {
                console.log("success");},
            error: function() {
                console.log("error");},
        });
    };

    //Toolbar button handler
    let tracking_button_handler = function() {
        tracking_handler($('#tracking-button').hasClass('active'));
    };

    let tracking_handler = function(tracking) {
        if (parameters.tracking){
            parameters.tracking = false;
            //TODO disables
        } else {
            parameters.tracking = true;
        };

        var button = $('#tracking-button');
        button.toggleClass('active', !tracking);

        var icon = button.find('i');
        icon.toggleClass('fa-square-check-o', tracking);
        icon.toggleClass('fa-square-o', !tracking);
    }


    // Toolbar button
    let TrackingButton = function () {
        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register ({
                help: 'toggle tracking',
                icon: 'fa-check-square-o',
                handler: tracking_button_handler
            }, 'toggle-tracking', 'Tracking'),
        ])).find('.btn').attr('id', 'tracking-button');
    }

    // Run on start
    function load_jupyter_extension() {
        TrackingButton();
        Tracking();
        //TODO persistence
    }
    return {
        load_jupyter_extension : load_jupyter_extension,
        load_ipython_extension : load_jupyter_extension
    };
});