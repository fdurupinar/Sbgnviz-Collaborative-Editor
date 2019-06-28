module.exports = (function() {

    var net = require('net');
    var StreamPair = require('./util/stream-pair.js');
    var KQML = require('./util/KQML/kqml.js');
    var DefaultHost = '127.0.0.1';
    // var DefaultHost = 'causalpath.org';
    var DefaultPort = 6200;

    var socket;


    function TripsModule(argv) {
        this.argv = argv;
    }
    TripsModule.prototype = {



        constructor: TripsModule,

        getParameter: function(name, defalt) {
            var i = this.argv.indexOf(name);
            if (i >= 0 && i + 1 < this.argv.length) {
                return this.argv[i+1];
            } else {
                return defalt;
            }
        },

        isParameterTrue: function(name) {
            var value = this.getParameter(name, 'no');
            return /^(true|t|yes)$/i.test(value);
        },

        handleCommonParameters: function() {
            this.host = DefaultHost;
            this.port = DefaultPort;
            var value;
            if ((value = this.getParameter('-connect')) !== undefined) {
                var i;
                if (/^(true|t|yes)$/i.test(value)) {
                    this.autoConnect = true;
                } else if (/^(false|nil|no)$/i.test(value)) {
                    this.autoConnect = false;
                } else if ((i = value.indexOf(':')) >= 0) {
                    this.host = value.slice(0,i);
                    this.port = parseInt(value.slice(i+1));
                } else {
                    this.host = value;
                }
            } else {
                this.autoConnect = true;
            }

            this.scanForPort = this.isParameterTrue('-scan');
            this.name = this.getParameter('-name',
                (typeof this.name == 'string') ? this.name.toLowerCase() : undefined);
            this.groupName = this.getParameter('-group',
                (typeof this.groupName == 'string') ? this.groupName.toLowerCase() : undefined);
            this.debuggingEnabled = this.isParameterTrue('-debug');
        },

        //FUNDA: socket connection needs to be closed
        disconnect: function(){

             console.log("TripsModule socket connection closed");
            socket.destroy();
        },

        connect: function(onconnect) {
            var that = this;
            try { //funda
                if (this.autoConnect) {
                    // TODO detect failure to connect somehow?
                    try {
                        socket = new net.connect(this.port, this.host, function () {

                            that.socket = KQML.wrapStream(socket);
                            that.socket.on('data', function (msg) {
                                that.handleMessage(KQML.keywordify(msg));
                            });
                            if (onconnect !== undefined) {
                                onconnect();
                            }

                            that.isConnected = true;

                            console.log("tripsModule: Connected to TRIPS.");

                        });

                        socket.on('error', function(){  //FUNDA: this detects disconnection
                            console.log("tripsModule: TRIPS is not connected.");
                            that.isConnected = false;


                        });
                    }
                    catch(e){
                        console.log("Could not connect. " +e);
                    }
                } else { // connect to stdin/stdout
                    var pair = new StreamPair(process.stdin, process.stdout);

                    this.socket = KQML.wrapStream(pair);
                    this.socket.on('data', function (msg) {
                        that.handleMessage(KQML.keywordify(msg));
                    });
                    if (onconnect !== undefined) {
                        onconnect();
                    }
                    that.isConnected = true;
                    console.log("tripsModule: Connected to TRIPS.");
                }


            }
            catch(e) {
                console.log(e + " Trips is disconnected.");
            }
        },

        register: function() {
            if (this.name !== undefined) {
                var msg = { 0: 'register', name: this.name };
                if (this.groupName !== undefined) {
                    msg.groupName = this.groupName;
                }
                this.sendMsg(msg);
            }
        },

        init: function(oninit) {
            this.handlers = {};
            //  this.pendingMessages = [];
            this.continuations = {};
            this.handleCommonParameters();
            var that = this;
            this.connect(function() {
                that.register();
                if (oninit !== undefined) {
                    oninit();
                }
            });
        },

        debug: function(msg) {
            if (this.debuggingEnabled) {
                process.stderr.write(msg + "\n");
            }
        },

        addHandler: function(pattern, handler, subscribe) {
            if (subscribe === undefined || subscribe) {
                this.sendMsg({ 0: 'subscribe', content: pattern });
            }
            this.handlers[KQML.toKQML(pattern)] =
                { pattern: pattern, handler: handler };
        },

        removeHandler: function(pattern) {
            this.handlers[KQML.toKQML(pattern)] = undefined;
        },

        sendWithContinuation: function(msg, cont) {
            console.log(this.continuations);
            var replyId;
            do {
                replyId = this.name + Math.floor(Math.random() *1000000);
            } while (replyId in this.continuations);
            this.continuations[replyId] = cont;
            var msgWithReplyId = { replyWith: replyId };
            for (var p in msg) { msgWithReplyId[p] = msg[p] }
            this.sendMsg(msgWithReplyId);
        },

        /* TODO? not sure I *can* do this in node.js
         sendAndWait: function(msg) {
         },
         */

        sendMsg: function(msg) {

            if(this.isConnected)
                this.socket.write(msg);


        },

        replyToMsg: function(msg, reply) {
            var modReply = { receiver: msg.sender };
            for (var p in reply) { modReply[p] = reply[p] }
            if ('replyWith' in msg) {
                modReply.inReplyTo = msg.replyWith;
            }
            this.sendMsg(modReply);
        },

        handleMessage: function(message) {
            //FUNDA?????
            if ('inReplyTo' in message) {
                var replyId = message.inReplyTo;
                if (replyId in this.continuations) {
                    var cont = this.continuations[replyId];
                    this.continuations[replyId] = undefined;
                    cont(message);
                } else {
                    this.sendMsg({ 0: 'error', content: ['bad-reply-id', replyId] });
                }
            } else { // not a reply, call handler
                var pat;
                for (var p in this.handlers) {
                    if (KQML.patternMatches(this.handlers[p].pattern, message)) {
                        pat = p;


                        break;


                    }
                }
                if (pat === undefined) {
                    //FUNDA process.stderr.write("No handler for message: " + KQML.toKQML(message) + " in "  + this.name + "\n");
                } else {
                    var handler = this.handlers[pat].handler;
                    handler.call(this, message);
                }
            }
        },

        run: function() {
            this.sendMsg({ 0: 'tell', content: ['module-status', 'ready'] });
            // NOTE: receiving messages handled by stream ondata callbacks
        }


    }

    TripsModule.prototype.isConnected = true; //funda
    return TripsModule;

})();