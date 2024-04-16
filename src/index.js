const { app, server, io, port } = require('./routes/main.js');
const socket = require("./socket/socket.js")


socket(io);


server.listen(port, () => console.log(`app listening on port ${port}!`));
