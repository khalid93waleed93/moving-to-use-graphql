import { Server } from 'http';
import {Server as socketServer} from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
let io: socketServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

export const socket = {
	init: (httpServer: Server) => {
		io = new socketServer(httpServer,{
			cors: {
				origin: "http://localhost:3000",
				// methods: ["GET", "POST"],
				// allowedHeaders: ["my-custom-header"],
				// credentials: true
			}});
		return io;
	},
	getIO: () => {
		if(!io){
			throw new Error('Socket.io not initialized');
		}
		return io;
	}
}