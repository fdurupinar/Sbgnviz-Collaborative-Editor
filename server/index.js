var derby = require('derby');

exports.run = run;
let model;
let server;
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        let list = Object(this);
        let length = list.length >>> 0;
        let thisArg = arguments[1];
        let value;

        for (let i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
// client names which are currently connected to the server



function run(app, options, cb) {
    options || (options = {});
    let port = options.port || process.env.PORT || 3000 ;//| process.env.OPENSHIFT_NODEJS_PORT ;

    function listenCallback(err) {

        console.log('%d listening. Go to: http://localhost:%d/', process.pid, port);
        cb && cb(err);
    }


    function createServer() {

        if (typeof app === 'string') app = require(app);

        require('./server').setup(app, options, function (err, expressApp, upgrade, refModel) {
            model = refModel;

            if (err) throw err;
            server = require('http').createServer(expressApp);


            let io = require('socket.io').listen(server);

            server.on('upgrade', upgrade);
            server.listen(port, listenCallback);




            let ServerSideSocketListener = require('./serverSideSocketListener.js');
            new ServerSideSocketListener(io, model);



        });


        return server;


    }

    derby.run(createServer);







}
