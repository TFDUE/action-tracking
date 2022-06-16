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
        "nickname": "maxmuster",
        "email": "max.muster@example.com",
        "aggravation": 15000,
        "intervals": 60000
    }

    //Tracking functionality
    let Tracking = function() {
        // initializes the temp data object on opening a notebook
        let data = initialize_data();

        //catches Jupyter notebook specific events and updates the data object accordingly
        $(events).on('create.Cell delete.Cell rendered.MarkdownCell execute.CodeCell output_added.OutputArea', function(event, argument) {
            if (params.tracking){
                if (event.type == 'create') {data.cell_create++;}
                else if (event.type == 'delete') {data.cell_delete++;}
                else if (event.type == 'rendered') {data.markdown_renders++;}
                else if (event.type == 'execute') {
                    //adds the cell_id (!= id) of the executed cell to the execute_id array and ads the cell_id to the metadata of the cell
                    // this is done because the id property of Jupyter notebook cells behaves very strange
                    data.execute_ids.push(argument.cell.cell_id);
                    argument.cell.metadata.cell_id = argument.cell.cell_id;
                    data.execute++;
                }
                else if (event.type == 'output_added') {
                    // checks if the output contains an error
                    // if that's the case it converts the current cell_id from the execution_id array to an array that contains the cell_id and an error flag
                    if (argument.output.output_type == "error"){
                        data.error++;
                        var last_element = data.execute_ids[data.execute_ids.length - 1];
                        data.execute_ids[data.execute_ids.length - 1] = [last_element, "error"]
                        prepare_payload(data, "error");
                    }
                }
            }
        });

        //catches general input events and updates the data object
        $(document).on('click mousemove keydown copy paste wheel', function(event) {
            if (params.tracking){
                if (event.type == 'click'){data.click++;}
                else if (event.type == 'mousemove') {data.mousemove++;}
                else if (event.type == 'keydown') {data.keydown++;}
                else if (event.type == 'copy') {data.copy++;}
                else if (event.type == 'paste') {data.paste++;}
                else if (event.type == 'wheel') {data.scroll++;}
            }
        });

        //tracks overall time spent on the notebook and updates the data object
        setInterval(function () {
            if (!document.hidden && params.tracking) {data.total_time += 1000;}
        }, 1000);


        //passes the initial data to the server
        prepare_payload(data, "initial");

        // initializes the data collection and counter for the data aggravation
        let collection = [data,{},{},{}];
        let i = 0;

        //fills the data collection array every aggravation interval and sends a packet with 4 data objects every 60 seconds
        setInterval(function (){
            if (params.tracking){
                var result = aggravate_data(data, collection, i);
                collection = result[0];
                i = result[1];
            } else {
                console.log("tracking disabled")
            }
        }, params.aggravation);
    };

    // The data aggravation function that counts the amount of data objects in the collection
    // On every fourth step it sends the filled data collection to the server
    let aggravate_data = function(aggr_data, aggr_collection, i){
        aggr_data.filename = Jupyter.notebook.notebook_name;
        aggr_data.timestamp = Date.now();
        aggr_collection[i] = Object.assign({}, aggr_data);
        Jupyter.notebook.metadata.tracking = aggr_data;
        i++;
        if (i >= (params.intervals / params.aggravation)) {
            prepare_payload(aggr_collection, "regular")
            return [[{}, {}, {}, {}], 0];
        } else {
            return [aggr_collection, i];
        }
    };

    // the data initialization function that checks if the opened notebook has been previously tracked
    // if that's not the case it creates the initial values otherwise it gathers the previously tracked data from the metadata
    let initialize_data = function() {
        let init_data = {};
        if (Jupyter.notebook.metadata.tracking == undefined) {
            init_data = {
                "cell_create": 0,
                "cell_delete": 0,
                "click": 0,
                "copy": 0,
                "error": 0,
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
            Jupyter.notebook.metadata.tracking = init_data;
        } else {
            init_data = Jupyter.notebook.metadata.tracking;
        };
        return init_data;
    };

    //packages the tracking data collection, notebook snapshot, user data and a parameter that states the reason for server transfer
    let prepare_payload = function(data, reason) {
        // if clause cancels the packaging and subsequent server transfer if tracking is disabled
        if (!params.tracking) {
            console.log("tracking disabled");
        } else {
            if ((reason === "initial") || (reason === "error")){
                data.timestamp = Date.now();
                data.filename = Jupyter.notebook.notebook_name;
                Jupyter.notebook.metadata.tracking = data;
            };
            Jupyter.notebook.save_notebook();
            let notebook_snapshot = Jupyter.notebook.toJSON();
            let user = {
                "email": params.email,
                "nickname": params.nickname,
            };
            let packet = {
                "_data": data,
                "_notebook": notebook_snapshot,
                "_user": user,
                "reason": reason
            };
            send_notebook(packet);
        }
    };


    // Sends prepared packet to server add api with an ajax call to add it to the database
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

    //sets the global tracking parameter according to button interaction and changes the icon accordingly
    let tracking_button_handler = function() {
        if (params.tracking){
            params.tracking = false;
        } else {
            params.tracking = true;
        };
        var icon = $('#tracking-button').find('i');
        icon.toggleClass('fa-check-square-o fa-square-o');
    };


    //initializes the toggling tracking toolbar button (id='tracking-button') with the according icon
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

    // updates the global parameters object according to the given information at the nbextensions install tab in the main menu
    // updates when a notebook is opened
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

    //runs on opening a notebook and executes the initialize function
    var load_jupyter_extension = function () {
        return Jupyter.notebook.config.loaded.then(initialize);
    };

    return {
        load_jupyter_extension : load_jupyter_extension,
        load_ipython_extension : load_jupyter_extension
    };
});