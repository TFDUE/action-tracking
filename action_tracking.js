define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
], function (
    $,
    Jupyter,
    events,
) {
    let params = {
        "tracking": false,
        "firstname": "jane",
        "lastname": "doe",
        "email": "jane.doe@example.com",
        "aggravation": 15000
    }

    //Tracking functionality
    let Tracking = function() { //TODO
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
                "scroll": 0,
                "timestamp": Date.now(),
                "total_time": 0,
            };
            Jupyter.notebook.metadata.tracking = temp_data;
            Jupyter.notebook.save_notebook();
        } else {
            temp_data = Jupyter.notebook.metadata.tracking;
        };

        let i = -1;
        let data_points = (60000 / params.aggravation);
        let data_collection = [temp_data,{},{},{}];

        //catches Jupyter notebook specific events and updates data object
        $(events).on('create.Cell delete.Cell rendered.MarkdownCell execute.CodeCell output_added.OutputArea', function(event, argument) {
            if (params.tracking){
                if (event.type == 'create') {temp_data.cell_create++;}
                else if (event.type == 'delete') {temp_data.cell_delete++;}
                else if (event.type == 'rendered') {temp_data.markdown_renders++;}
                else if (event.type == 'execute') {
                    temp_data.execute_ids.push(Jupyter.notebook.get_selected_cell().id);
                    temp_data.execute++;
                }
                else if (event.type == 'output_added') {
                    if (argument.output.output_type == "error"){
                        temp_data.error_ids.push(Jupyter.notebook.get_selected_cell().id);
                        temp_data.error++;
                        prepare_payload(data_collection);
                    }
                }
            }
        });

        //catches general input events and updates data object
        $(document).on('click mousemove keydown copy paste wheel', function(event) {
            if (params.tracking){
                if (event.type == 'click'){temp_data.click++;}
                else if (event.type == 'mousemove') {temp_data.mousemove++;}
                else if (event.type == 'keydown') {temp_data.keydown++;}
                else if (event.type == 'copy') {temp_data.copy++;}
                else if (event.type == 'paste') {temp_data.paste++;}
                else if (event.type == 'wheel') {temp_data.scroll++;}
            }
        });

        //tracks time spent on notebook and updates data object
        setInterval(function () {
            if (!document.hidden && params.tracking) {temp_data.total_time += 1000;}
        }, 1000);

        //sends the initial data, notebook snapshot and user data
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
        }, params.aggravation);
    };

    //packages the tracking data, notebook snapshot and user data for server transfer
    let prepare_payload = function(data) {
        let notebook_snapshot = {};
        if (!params.tracking) {
            notebook_snapshot = {"tracking":"disabled"};
        } else {
            notebook_snapshot = Jupyter.notebook.toJSON()
        };
        let user = {
            "email": params.email,
            "firstname": params.firstname,
            "lastname": params.lastname,
        };
        let packet = {
            "_data":data,
            "_notebook":notebook_snapshot,
            "_user": user
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
                console.log("server success");},
            error: function() {
                console.log("server error");},
        });
    };

    //sets the global tracking parameter according to button interaction and changes the icon
    let tracking_button_handler = function() {
        if (params.tracking){
            params.tracking = false;
        } else {
            params.tracking = true;
        };
        var icon = $('#tracking-button').find('i');
        icon.toggleClass('fa-check-square-o fa-square-o');
    }


    //initializes the toggling tracking toolbar button with the according icon
    let TrackingButton = function () {
        let icon = (params.tracking ? 'fa-check-square-o' : 'fa-square-o');

        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register ({
                help: 'toggle tracking',
                icon: icon,
                handler: tracking_button_handler
            }, 'toggle-tracking', 'Tracking'),
        ])).find('.btn').attr('id', 'tracking-button');
    };

    //updates the parameters on opening a notebook
    let update_params = function() {
        var config = Jupyter.notebook.config;
        for (var key in params) {
            if (config.data.hasOwnProperty(key) ){
                params[key] = config.data[key];
            }
        }
    };

    var initialize = function () {
        update_params();
        TrackingButton();
        Tracking();
    };

    //runs on start
    var load_jupyter_extension = function () {
        return Jupyter.notebook.config.loaded.then(initialize);
    };

    return {
        load_jupyter_extension : load_jupyter_extension,
        load_ipython_extension : load_jupyter_extension
    };
});

/** TODO list
 * nesting
 * commenting
 * ---
 * example notebook
 * readme file
 */
