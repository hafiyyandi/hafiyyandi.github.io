// See https://ml5js.org/docs/LSTMGenerator

var lstm;
var displayText;
var all_generations = [];
var CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
var seed = "";
var seed_length = 100;
var def_seed = "n65_d479 n63_d479 n62_d479 n63_d479 n60_d959"; //default seed
//var t_gens = []; //contains all generated notes & beat.
var t_index_0 = 0;
var t_index_1 = 0;
var t_gen_0;
var t_gen_1;
var is0Done = false;
var is1Done = false;

//visualization variables
var dots = [];
var push_speed = 1;
var rot_speed = 1;
var dot_size = 2;
var dot_msize = 8;
var thresh = 300;

var circs = [];
var circ_index = 0;

var isMelody = false;

var key_note_map = [
    ['A', 65, 'C5', false],
    ['W', 87, 'C#5', false],
    ['S', 83, 'D5', false],
    ['E', 69, 'D#5', false],
    ['D', 68, 'E5', false],
    ['F', 70, 'F5', false],
    ['T', 84, 'F#5', false],
    ['G', 71, 'G5', false],
    ['Y', 89, 'G#5', false],
    ['H', 72, 'A5', false],
    ['U', 85, 'A#5', false],
    ['J', 74, 'B5', false],
    ['K', 75, 'C6', false],
    ['O', 79, 'C#6', false],
    ['L', 76, 'D6', false],
    ['P', 80, 'D#6', false],
    [';', 186, 'E6', false]
];
var def_classes = [];

function preload() {
    // Create the LSTM Generator with a pre trained model
    lstm_0 = ml5.LSTMGenerator('models/data_track0/');
    console.log(lstm_0);
    lstm_1 = ml5.LSTMGenerator('models/data_track1/');
    console.log(lstm_1);
}


//TRACK 0 SYNTH
var synth_0 = new Tone.PolySynth(4, Tone.Synth, {
    "oscillator": {
        "partials": [0, 2, 3, 6],
    }
}).toMaster();

//TRACK 1 SYNTH
var synth_1 = new Tone.PolySynth(4, Tone.Synth, {
    "oscillator": {
        "partials": [0, 2, 3, 6],
    }
}).toMaster();



function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(30);

    //Show LOADING until both LSTM models are ready, then invite input
    var statusPoll = setInterval(function() {
        if (lstm_0 && lstm_1 && lstm_0.ready && lstm_1.ready) {
            var status = document.getElementById("status");
            if (status.innerHTML === "LOADING") {
                status.innerHTML = "START PLAYING";
            }
            clearInterval(statusPoll);
        }
    }, 100);

    //INITIALIZE DOTS FOR MELODY VISUALIZATION
    for (var i = 0; i < 108; i++) {
        //console.log(i);
        var dot = {
            index: i,
            r: 100,
            deg: i * 360 / 108, //108 different pitches
            isWithin: true, //!NEED TO EVALUATE THIS!!!!
            isMoving: false,
            alpha: 255,
            rmax: thresh,
            dot_size: dot_size,
            //pnoise:0.1,
            display: function() {
                if (this.r < this.rmax) {
                    //console.log(i);
                    var x = this.r * cos(this.deg) + windowWidth / 2;
                    var y = this.r * sin(this.deg) + windowHeight / 2;
                    if (!this.isMoving) {
                        x += random(-3, 3);
                        y += random(-3, 3);
                    }
                    noStroke();
                    fill(255, 255, 255, this.alpha);
                    ellipse(x, y, this.dot_size, this.dot_size);
                } else if (this.alpha > 0) {
                    this.alpha--;
                    var x = this.r * cos(this.deg) + windowWidth / 2;
                    var y = this.r * sin(this.deg) + windowHeight / 2;
                    noStroke();
                    fill(255, 255, 255, this.alpha);
                    ellipse(x, y, this.dot_size, this.dot_size);
                }
            },
            move: function() {
                // if (this.r < this.rmax) {
                //     this.r += push_speed;
                //     console.log(this.index+ " PUSHED!");
                //     console.log(this.r);
                // }
                // if (this.r > thresh) {
                //     this.deg += rot_speed*0.1;
                // }
                this.r += push_speed;
                this.deg += rot_speed * 0.05;
                if (this.dot_size < dot_msize) {
                    this.dot_size += 0.05;
                }

            },
            reset: function() {
                console.log(this.index + " RESET!");
                this.r = 100;
                this.deg = this.index * 360 / 108;
                this.isWithin = true;
                this.isMoving = false;
                this.alpha = 255;
                this.dot_size = dot_size;
            }
        }
        dots.push(dot);
    }

    //INITIALIZE HARMONY VISUALIZATION ARRAY
    createCirc(0);

    //SAVE DEFAULT KEY'S CLASSES
    for (var j = 0; j < key_note_map.length; j++) {
        var btn = document.getElementById(key_note_map[j][0]);
        var def_class = btn.className;
        def_classes.push(def_class);
    }

    //WIRE ON-SCREEN KEYS SO MOUSE AND TOUCH ALSO PLAY NOTES
    for (var k = 0; k < key_note_map.length; k++) {
        (function(i) {
            var btn = document.getElementById(key_note_map[i][0]);
            var pressed = false;
            var press = function(e) {
                e.preventDefault();
                if (pressed) return;
                pressed = true;
                btn.setAttribute('class', def_classes[i] + ' down');
                noteOn(toMidi(key_note_map[i][2]));
            };
            var release = function() {
                if (!pressed) return;
                pressed = false;
                btn.setAttribute('class', def_classes[i]);
                noteOff(toMidi(key_note_map[i][2]));
            };
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release);
            btn.addEventListener('touchcancel', release);
        })(k);
    }

    //RELEASE HELD INPUT NOTES IF THE TAB LOSES FOCUS (keyup would be missed)
    window.addEventListener('blur', function() {
        synth_m.releaseAll();
        clearInterval(timerInterval);
        timer = 0;
        for (var i = 0; i < key_note_map.length; i++) {
            if (key_note_map[i][3]) {
                key_note_map[i][3] = false;
                document.getElementById(key_note_map[i][0]).setAttribute('class', def_classes[i]);
            }
        }
    });
}

function draw() {
    //background(0,0,0,200);
    background(0);

    //HARMONY VISUALIZATION
    for (var j = 0; j < circs.length; j++) {
        if (circs[j].alpha > 0) {
            circs[j].expand();
            circs[j].display();
        }
    }

    //MELODY VISUALIZATION
    for (var i = 0; i < 108; i++) {
        if (dots[i].alpha > 0) {
            dots[i].display();
            if (dots[i].isMoving) {
                dots[i].move();
            }
        } else {
            dots[i].reset();
        }
    }

    checkKeyDown();

}

function generateResponse() {
    // Generate content
    document.getElementById("status").innerHTML = "GENERATING...";
    console.log("GENERATING...");


    //TRACK 0
    lstm_0.generate({
        seed: seed,
        length: seed_length,
        temperature: 0.5
    }, function(results) {
        console.log("TRACK 0 DONE");
        // displayText = results.generated;
        // all_generations.push(displayText);

        //console.log(results.generated);

        var str_gens = results.generated + "";
        var parsed_gens = str_gens.split(" "); //SPLIT GENERATION FOR EACH BEAT
        var t_gen = [];
        var t_dur;


        for (i in parsed_gens) {
            var temp = parsed_gens[i].split("_"); //SPLIT INTO NOTES & DURATION

            //STORE GENERATED NOTES
            var t_notes = []; //t_notes holds the notes per beat
            var notes = temp[0];
            indiv_notes = notes.split("n");
            //console.log(indiv_notes);

            for (j in indiv_notes) {
                if (j != 0) {
                    //console.log(indiv_notes[j]);
                    var note = fromMidi(indiv_notes[j]);
                    //console.log(note);
                    t_notes.push(note);
                }
            }

            //STORE GENERATED DURATIONS
            if (temp[1]) {
                dur = temp[1].split("d");
                t_dur = dur[1];
                //console.log("dur: "+t_dur);
            }

            //if duration value exists
            if (t_dur) {
                t_gen.push([t_notes, t_dur]);
            }

        }
        //console.log(t_gen);
        //console.log("0: "+t_gen);
        t_gen_0 = t_gen;
        is0Done = true;
        if (is0Done && is1Done) {
            playGen_1(t_gen_1);
            playGen_0(t_gen_0);
            is0Done = false;
            is1Done = false;
            input = ""; //reset input seed
            document.getElementById("status").innerHTML = "PLAYING!";
            var remove = setTimeout(function() {
                document.getElementById("status").innerHTML = "";
            }, 1500);
            //isRecording = true;
        }

    });

    //TRACK 1
    lstm_1.generate({
        seed: seed,
        length: seed_length,
        temperature: 0.5
    }, function(results) {
        console.log("TRACK 1 DONE");
        // displayText = results.generated;
        // all_generations.push(displayText);

        //console.log(results.generated);

        var str_gens = results.generated + "";
        var parsed_gens = str_gens.split(" "); //SPLIT GENERATION FOR EACH BEAT
        var t_gen = [];
        var t_dur;


        for (i in parsed_gens) {
            var temp = parsed_gens[i].split("_"); //SPLIT INTO NOTES & DURATION

            //STORE GENERATED NOTES
            var t_notes = []; //t_notes holds the notes per beat
            var notes = temp[0];
            indiv_notes = notes.split("n");
            //console.log(indiv_notes);

            for (j in indiv_notes) {
                if (j != 0) {
                    //console.log(indiv_notes[j]);
                    var note = fromMidi(indiv_notes[j]);
                    //console.log(note);
                    t_notes.push(note);
                }
            }

            //STORE GENERATED DURATIONS
            if (temp[1]) {
                dur = temp[1].split("d");
                t_dur = dur[1];
                //console.log("dur: "+t_dur);
            }

            //if duration value exists
            if (t_dur) {
                t_gen.push([t_notes, t_dur]);
            }

        }
        //console.log(t_gen);
        //console.log("0: "+t_gen);

        t_gen_1 = t_gen;
        is1Done = true;
        if (is0Done && is1Done) {
            playGen_1(t_gen_1);
            playGen_0(t_gen_0);
            is0Done = false;
            is1Done = false;
            input = ""; //reset input seed
            document.getElementById("status").innerHTML = "PLAYING!";
            var remove = setTimeout(function() {
                document.getElementById("status").innerHTML = "";
            }, 1500);
            //isRecording = true;
        }


    });

}

//convert midi number to musical note
function fromMidi(midi) {
    var name = CHROMATIC[midi % 12]
    var oct = Math.floor(midi / 12) - 1
    if (oct > 0) {
        return name + oct
    } else return name + "4" //THIS IS A BAD WORKAROUND

}

// generates an array where indices correspond to midi notes
var everyNote = 'C,C#,D,D#,E,F,F#,G,G#,A,A#,B,'.repeat(20).split(',').map(function(x, i) {
    return x + '' + Math.floor(i / 12);
});

//returns the midi pitch value for the given note.
//returns -1 if not found
function toMidi(note) {
    return everyNote.indexOf(note);
}

var playRun_0 = 0; //bumped per response so a stale chain stops itself

function playGen_0(t_gen) {
    playRun_0++;
    t_index_0 = 0;
    synth_0.releaseAll(); //cut anything left over from the previous response
    stepGen_0(t_gen, playRun_0);
}

function stepGen_0(t_gen, run) {

    //capture this beat's chord & duration so the release matches the attack
    var chord = t_gen[t_index_0][0];
    var dur = t_gen[t_index_0][1];

    //failsafe for notes that are way too long
    if (dur > 2000) {
        dur = 1000;
    }
    console.log("TRACK 0: ");
    console.log(chord);

    //VISUALIZE MELODY
    for (var i = 0; i < chord.length; i++) {
        var midinote = toMidi(chord[i]);
        console.log(midinote);
        //drawLine(midinote);
        if (midinote != -1) {
            dots[midinote].isMoving = true;
        }
    }
    //console.log("0: " + fromMidi(chord));

    if (isMelody) {
        synth_0.triggerAttack(chord);
        //genShapes(chord);

        setTimeout(function() {
            synth_0.triggerRelease(chord);

            if (run != playRun_0) {
                return; //a newer response took over
            }
            //play next note
            if (t_index_0 < (t_gen.length - 1)) {
                t_index_0++;
                stepGen_0(t_gen, run);
            } else {
                t_index_0 = 0;
            }
        }, dur);

    }

}

var playRun_1 = 0; //bumped per response so a stale chain stops itself

function playGen_1(t_gen) {
    playRun_1++;
    t_index_1 = 0;
    synth_1.releaseAll(); //cut anything left over from the previous response
    stepGen_1(t_gen, playRun_1);
}

function stepGen_1(t_gen, run) {

    //capture this beat's chord & duration so the release matches the attack
    var chord = t_gen[t_index_1][0];
    var dur = t_gen[t_index_1][1];

    //failsafe for notes that are way too long
    if (dur > 2000) {
        dur = 1000;
    }
    console.log("TRACK 1: ");
    console.log(chord);

    //VISUALIZE HARMONY
    for (var i = 0; i < chord.length; i++) {
        var midinote = toMidi(chord[i]);
        console.log(midinote);
        createCirc(midinote);
    }

    if (!isMelody) {
        synth_1.triggerAttack(chord);
        // //genShapes(chord);

        setTimeout(function() {
            synth_1.triggerRelease(chord);

            if (run != playRun_1) {
                return; //a newer response took over
            }
            //play next note
            if (t_index_1 < (t_gen.length - 1)) {
                t_index_1++;
                stepGen_1(t_gen, run);
            } else {
                t_index_1 = 0;

            }
        }, dur);

    }
}

function keyPressed() {
    //console.log(keyCode);
    if (keyCode == 32) {
        seed = input;
        generateResponse();
        input = '';
    }
    if (keyCode == ENTER) {
        seed = def_seed;
        generateResponse();
    }
    // switch (keyCode){
    //     case 65://A
    //     document.getElementbyId("A").
    // }
}

function checkKeyDown() {
    for (var i = 0; i < key_note_map.length; i++) {
        var btn = document.getElementById(key_note_map[i][0]);
        //var def_class = btn.className;
        if (keyIsDown(key_note_map[i][1])) {
            if (!key_note_map[i][3]) { //if this is the first time key is pressed
                console.log(key_note_map[i][0] + " pressed!");
                key_note_map[i][3] = true;
                if (def_classes[i] == 'key end') {
                    btn.setAttribute('class', 'key end down');
                } else if (def_classes[i] == 'key black') { //black key
                    btn.setAttribute('class', 'key black down');
                } else { //normal key
                    btn.setAttribute('class', 'key down');
                }

                noteOn(toMidi(key_note_map[i][2]));
            }
        } else if (key_note_map[i][3]) { //if key is no longer pressed!
            btn.setAttribute('class', def_classes[i]);
            key_note_map[i][3] = false;
            console.log(key_note_map[i][0] + " released!");
            noteOff(toMidi(key_note_map[i][2]));
        }
    }
}

function toggleResp() {
    console.log("TOGGLED");
    isMelody = !isMelody;
}

function createCirc(midinote) {
    var circle = {
        index: circ_index,
        r: 200,
        rmax: 1500,
        alpha: map(midinote, 0, 108, 80, 150),
        expand: function() {
            this.alpha--;
            if (this.r < this.rmax) { //is this necessary? YES to limit memory use
                this.r += 15;
            }
        },
        display: function() {
            push();
            stroke(255, 255, 255, this.alpha);
            strokeWeight(0.5);
            noFill();
            ellipse(windowWidth / 2, windowHeight / 2, this.r, this.r);
            pop();
        }
    }
    circs.push(circle);
    circ_index++;
}