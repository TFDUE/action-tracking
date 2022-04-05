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
        let temp_data = {};
        if (Jupyter.notebook.metadata.tracking == undefined) {
            temp_data = {
                "cell_create": 0,
                "cell_delete": 0,
                "click": 0,
                "copy": 0,
                "error": 0,
                "error_ids": [],
                "execute": 0,
                "execute_ids": [],
                "file_id": Math.floor(Math.random() * 100000) + Date.now().toString().slice(-5),
                "filename": Jupyter.notebook.notebook_name,
                "keydown": 0,
                "markdown_renders": 0,
                "mousemove": 0,
                "paste": 0,
                "scroll": 0, //TODO
                "timestamp": Date.now(),
                "total_time": 0,
            };
            Jupyter.notebook.metadata.tracking = temp_data;
            Jupyter.notebook.save_notebook();
        } else {
            temp_data = Jupyter.notebook.metadata.tracking;
        };

        let i = -1;
        let data_points = (60000 / parameters.aggravation);
        let data_collection = [temp_data,{},{},{}];

        //catches Jupyter notebook specific events and updates data object
        $(events).on('create.Cell delete.Cell rendered.MarkdownCell execute.CodeCell output_added.OutputArea', function(event, argument) {
            if (parameters.tracking){
                if (event.type == 'create') {temp_data.cell_create++;}
                else if (event.type == 'delete') {temp_data.cell_delete++;}
                else if (event.type == 'rendered') {temp_data.markdown_renders++;}
                else if (event.type == 'execute') {
                    temp_data.execute_ids.push(Jupyter.notebook.get_selected_cell().id); //TODO testing
                    temp_data.executes++;
                }
                else if (event.type == 'output_added') {
                    if (argument.output.output_type == "error"){
                        temp_data.error_ids.push(Jupyter.notebook.get_selected_cell().id); //TODO testing
                        temp_data.errors++;
                        prepare_payload(data_collection);
                    }
                }
            }
        });

        //catches general input events and updates data object
        $(document).on('click mousemove keydown copy paste delete.Cell', function(event) {
            if (parameters.tracking){
                if (event.type == 'click'){temp_data.click++;}
                else if (event.type == 'mousemove') {temp_data.mousemove++;}
                else if (event.type == 'keydown') {temp_data.keydown++;}
                else if (event.type == 'copy') {temp_data.copy++;}
                else if (event.type == 'paste') {temp_data.paste++;}
            }
        });

        //tracks time spent on notebook and updates data object
        setInterval(function () {
            if (!document.hidden && parameters.tracking) {temp_data.total_time += 1000;}
        }, 1000);

        //sends the initial data and notebook snapshot
        prepare_payload(data_collection);

        //fills the data collection array every aggravation interval and sends the data and notebook every 60 seconds
        setInterval(function () {
            temp_data.filename = Jupyter.notebook.notebook_name;
            temp_data.timestamp = Date.now();
            i++;
            if (i >= data_points){
                i = 0;
                prepare_payload(data_collection);
                data_collection = [{},{},{},{}];
            };
            data_collection[i] = Object.assign({}, temp_data);
        }, parameters.aggravation);
    };

    //packages the tracking data, notebook snapshot and user data for server transfer
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
            "user":"na" //TODO -> limit output extension
        };
        send_notebook(packet);
    }


    // Sends prepared packet to server
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

    //Button handler for toggling the tracking functionality
    let tracking_button_handler = function() {
        tracking_handler($('#tracking-button').hasClass('active'));
    };

    //sets the global tracking parameter according to button interaction and changes icons
    let tracking_handler = function(tracking) {
        if (parameters.tracking){
            parameters.tracking = false; //TODO (optional) disables tracking
        } else {
            parameters.tracking = true;
        };

        var button = $('#tracking-button');
        button.toggleClass('active', !tracking);

        var icon = button.find('i');
        icon.toggleClass('fa-square-check-o', tracking);
        icon.toggleClass('fa-square-o', !tracking);
    }


    //initializes the toggling tracking toolbar button
    let TrackingButton = function () {
        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register ({
                help: 'toggle tracking',
                icon: 'fa-check-square-o',
                handler: tracking_button_handler
            }, 'toggle-tracking', 'Tracking'),
        ])).find('.btn').attr('id', 'tracking-button');
    }

    //runs on start
    function load_jupyter_extension() {
        TrackingButton();
        Tracking();
    }
    return {
        load_jupyter_extension : load_jupyter_extension,
        load_ipython_extension : load_jupyter_extension
    };
});