/** Globals: 
 * $        (jQuery)
 * game
 * document
 * parent   (for simulator), 
**/

var gui = {
    graph_bgcolor: [
        'rgba(255, 0, 0, 0.2)',
        'rgba(0, 0, 255, 0.2)',
        'rgba(0, 255, 0, 0.2)',
        'rgba(255, 255, 0, 0.2)'
        ],
    graph_bordercolor: [
        'rgba(255, 0, 0, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 255, 0, 1)',
        'rgba(255, 255, 0, 1)'
        ],
    
    initialize: function()
    { 
        gui.init_chart();
        gui.tail_open = false;
        gui.dice0 = new dice($('#dice0'));
        gui.dice1 = new dice($('#dice1'));
        dice1.juggleinterval = 30; // Set different than 0, maybe someone will notice...

        document.getElementById('nrplayers').onkeyup = gui.update_players;
        document.getElementById('decrementplayers').onclick = gui.decrementplayers;
        document.getElementById('incrementplayers').onclick = gui.incrementplayers;
        document.getElementById('startgame').onclick = gui.new_game;
        document.getElementById('closenew').onclick = gui.new_game_close;
        document.getElementById('opennew').onclick = gui.new_game_open;
		document.getElementById('openset').onclick = gui.settings_open;
		document.getElementById('closeset').onclick = gui.settings_close;
        
        
        document.getElementById('mode0').onclick = function () { app.setSpecialMode(0) ; };
        document.getElementById('mode1').onclick = function () { app.setSpecialMode(1) ; };
        document.getElementById('mode2').onclick = function () { app.setSpecialMode(2) ; };
        document.getElementById('mode3').onclick = function () { app.setSpecialMode(3) ; };
        document.getElementById('mode4').onclick = function () { app.setSpecialMode(4) ; };
        
        /* Game is not yet available when this code is parsed. Therefore, use an anonymous function to wrap. */
        document.getElementById('dice0').ontouchstart = function () { game.button_down()};
        document.getElementById('dice0').ontouchend = function () { game.button_up()};
        document.getElementById('dice1').ontouchstart = function () { game.button_down()};
        document.getElementById('dice1').ontouchend = function () { game.button_up()};
        document.getElementById('tail').onclick = gui.toggle_tail;
        
        document.getElementById('brightness').onchange = function () { var brightness = document.getElementById('brightness').value; app.sendBrightness(brightness); game.update_btle()};
        document.getElementById('onbutton').onclick = function () { app.sendPower(1)};
        document.getElementById('offbutton').onclick = function () { app.sendPower(0)};
        
        gui.update_players();
        /* Try to bind to the simulator hooks */
        var button = parent.document.getElementById('bigredbutton');
        var board = parent.document.getElementById('board');
        /* If button is not found, we are not running in the sim-sim */
        if(! (button === null)) {
            /* Game is not yet available when this code is parsed. Therefore, use an anonymous function to wrap. */
            document.getElementById('dice0').onmousedown = function () { game.button_down()};
            document.getElementById('dice0').onmouseup = function () { game.button_up()};
            document.getElementById('dice1').onmousedown = function () { game.button_down()};
            document.getElementById('dice1').onmouseup = function () { game.button_up()};
            button.onmousedown = function () { game.button_down()};
            button.onmouseup = function () { game.button_up() };
            game.update_btle = function () { parent.document.getElementById('board').innerHTML = get_svg(game.board)};
        }
        if(! (board === null)) {
            board.innerHTML = '';
        }
        window.setTimeout(gui.request_battery_update, 15*1000);
    },
    
    request_battery_update: function() {
        app.updateBatteryLevel(gui.set_battery_level);
        setTimeout(gui.request_battery_update, 15*1000);
    },
    
    set_battery_level: function(data) {
        document.getElementById('battery').value = data[0];
    },
    
    init_chart: function() {
        
        // Init Graph
        var options = {
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true
                }]
            },
            maintainAspectRatio : false
        };
        var data = {
            labels: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
            datasets: [
                {
                    label: 'All players',
                    backgroundColor: gui.graph_bgcolor[0],
                    borderColor: gui.graph_bordercolor[0],
                    borderWidth: 1,
                    data: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                }
            ]
        };
        var ctx = document.getElementById('myChart');
        gui.chart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    },
    
    update_chart: function(data) {
        var datasets = [];
        for(i=0; i<data.length; i++) {
            datasets.push( {
                label : data[i].name,
                backgroundColor : gui.graph_bgcolor[i],
                borderColor : gui.graph_bordercolor[i],
                borderWidth : 1,
                data : data[i].data
            });
        }
        gui.chart.data.datasets = datasets;
        gui.chart.update();
        $('#nextturn').html('Next player: ' + game.get_player());
    },
    
    ask_startroll : function() {
        $('#nextturn').html('Roll for start-order: ' + game.get_player());
    },
    
    ask_start : function() {
        $('#nextturn').html('First player: ' + game.get_player());
    },

    setTotal: function (num) {
      $('#current_number').html('Current number: '+num);
    },
    
    play_sound : function (soundfile){
        var snd = new Audio(soundfile);
        snd.play();
    },
    
    dice_roll: function() {
        gui.dice0.start_juggle();
        gui.dice1.start_juggle();
    },
    
    dice_set: function(val0, val1) {
        gui.dice0.set_face(val0);
        gui.dice1.set_face(val1);
        $('#total').html('Total: ' + (val0 + val1));
    },
    
    msg_write: function(msg) {
        $('#total').html(msg);
    },
    
    log_line: function(message) {
      $('<div />').text(message).appendTo('#tail');
      var height = $('#tail').get(0).scrollHeight;
      $('#tail')[0].scrollTop = height;
    },
    
    decrementplayers: function() {
        var input = $('#nrplayers');
        var number = parseInt(input.val());
        if(number > 1) {
            number -= 1;
        }
        input.val(number);
        gui.update_players();
    },
    
    incrementplayers: function() {
        var input = $('#nrplayers');
        var number = parseInt(input.val());
        if(number < 4) {
            number += 1;
        }
        input.val(number);
        gui.update_players();
    },
    
    update_players: function() {
        var input = $('#nrplayers');
        var number = parseInt(input.val());
        for(var i = 0; i < 4; i++) {
            var box = $('#player' + i);
            if(i < number) {
                box.css('display', 'inline');
            }
            else {
                box.css('display', 'none');
            }
        }
     },
     
     new_game: function() {
        gui.new_game_close();
        var players = [];
        
        var input = $('#nrplayers');
        var number = parseInt(input.val());
        for(var i = 0; i < number; i++) {
            var box = $('#player' + i);
            players.push(box.val());
        }
        var boardtype = $('input[name=gametype]:radio:checked').val();
        var seed = $('#boardseed').val();
        
        game.new_game(boardtype, players, seed);
        
        /* Update simulator. */
        var board = parent.document.getElementById('board');
        if(! (board === null)) {
            board.innerHTML = get_svg(game.board);
        }
    },
     
    new_game_close: function() {
        var playerwindow = $('#newgame');
        playerwindow.css('display', 'none');
    },
     
    new_game_open: function() {
        var playerwindow = $('#newgame');
        playerwindow.css('display', 'inline');
    },

    settings_close: function() {
        var playerwindow = $('#settings_page');
        playerwindow.css('display', 'none');
    },
	
	settings_open: function() {
        var playerwindow = $('#settings_page');
        playerwindow.css('display', 'inline');
    },
    
    set_battery_level: function(level) {
        gui.log_line("Setting level to: " + level)
        var levelgage = $('#battery');
        levelgage.val(level);
    },
    
    toggle_tail : function() {
        if(gui.tail_open) {
            $('#tail').height('15px');
            gui.tail_open = false;
        }
        else {
            $('#tail').height('250px');
            gui.tail_open = true;
        }
    },
};
