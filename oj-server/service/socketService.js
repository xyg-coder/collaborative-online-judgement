var redisClient = require('../modules/redisClient');
const TIMEOUT_IN_SECONDS = 3600;

module.exports = function (io) {
    // collaboration sessions
    var collaborations = new Map();
    // map from socketId to sessionId
    var socketIdToSessionId = new Map();

    var sessionPath = '/temp_sessions';

    io.on('connection', socket => {
        let sessionId = socket.handshake.query["sessionId"];
        socketIdToSessionId.set(socket.id, sessionId);

        if (collaborations.has(sessionId)) {
            collaborations.get(sessionId)['participants'].push(socket.id);
        } else {
            redisClient.get(sessionPath + '/' + sessionId, function (data) {
                if (data) {
                    console.log('session terminated previously, pulling back from redis');
                    collaborations.set(sessionId, {
                        'cachedChangeEvents': JSON.parse(data),
                        'participants': []
                    });
                } else {
                    console.log('create new session ' + sessionId);
                    collaborations.set(sessionId, {
                        'cachedChangeEvents':[],
                        'participants': []
                    });
                }
                console.log(collaborations);
                collaborations.get(sessionId)['participants'].push(socket.id);
            });
        }
        // handle the change events
        socket.on('change', delta => {
            let sessionId = socketIdToSessionId.get(socket.id);
            console.log('change' + sessionId + ' ' + delta);
            if (collaborations.has(sessionId)) {
                collaborations.get(sessionId)['cachedChangeEvents'].push(['change', delta, Date.now()]);
            }
            forwardEvents(socket.id, 'change', delta);
        });

        socket.on('restoreBuffer', () => {
            const sessionId = socketIdToSessionId.get(socket.id);
            console.log('restoring buffer for session: ' + sessionId + ', socket: ' + socket.id);
            if (collaborations.has(sessionId)) {
                const changeEvents = collaborations.get(sessionId)['cachedChangeEvents'];
                for (let i = 0; i < changeEvents.length; i++) {
                    socket.emit(changeEvents[i][0], changeEvents[i][1]);
                }
            }
        });

        // handle the cursor move event
        socket.on('cursorMove', cursor => {
            console.log('cursor move' + socketIdToSessionId.get(socket.id) + ' ' + cursor);
            cursor = JSON.parse(cursor);
            cursor['socketId'] = socket.id;
            forwardEvents(socket.id, 'cursorMove', JSON.stringify(cursor));
        });

        socket.on('changeLanguage', language => {
            console.log('change language: ' + socketIdToSessionId.get(socket.id) + ' ' + language);
            if (collaborations.has(sessionId)) {
                collaborations.get(sessionId)['cachedChangeEvents'].push(['changeLanguage', language, Date.now()]);
            }
            forwardEvents(socket.id, 'changeLanguage', language);
        });

        socket.on('disconnect', function () {
            const sessionId = socketIdToSessionId.get(socket.id);
            console.log('socket ' + socket.id + ' disconnected');
            if (collaborations.has(sessionId)) {
                let participants = collaborations.get(sessionId)['participants'];
                let index = participants.indexOf(socket.id);
                if (index >= 0) {
                    participants.splice(index, 1);
                    if (participants.length == 0) {
                        console.log('last participants left. Move to redis');
                        let key = sessionPath + '/' + sessionId;
                        let value = JSON.stringify(collaborations.get(sessionId)['cachedChangeEvents']);
                        redisClient.set(key, value, redisClient.redisPrint);
                        redisClient.expire(key, TIMEOUT_IN_SECONDS);
                        collaborations.delete(sessionId);
                    }
                }
            }
        });

        function forwardEvents(socketId, eventName, dataString) {
            let sessionId = socketIdToSessionId.get(socketId);
            if (collaborations.has(sessionId)) {
                let participants = collaborations.get(sessionId)['participants'];
                for (let i = 0; i < participants.length; i++) {
                    if (socket.id !== participants[i]) {
                        io.to(participants[i]).emit(eventName, dataString);
                    }
                }

            } else {
                console.log('The sessionId is not in the collaborations');
            }
        }


    });
};