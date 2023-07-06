import express, { NextFunction, Request, Response }  from "express";
import * as feed from "./src/routes/feed";
import * as auth from "./src/routes/auth";
import mongoose from "mongoose";
import path from "path";
import multer, {FileFilterCallback, } from"multer";
import { socket } from './socket'
import {v4} from "uuid";
declare global {
	interface Error {
		statusCode?: number;
	}
}
declare global {
	namespace Express {
		export interface Request {
				userId?: string;
		}
	}
}

const app = express();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null,'images');
	},
	filename: (req, file, cb) => {
		// cb(null, new Date().toISOString() + file.originalname);
		const date = new Date().toISOString().split('T')
		cb(null,date[0]+'-'+date[1].split('.')[0].replace(/:/g,'-') + '-' + file.originalname); //for windows
	},
})
const fileFilter = (req:Request, file:Express.Multer.File, cb:FileFilterCallback) => {
	if(
		file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' 
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
}
app.use(express.json());
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req: Request, res: Response, next: NextFunction) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

app.use('/feed', feed.router);
app.use('/auth', auth.router);
app.use((error:any, req:Request, res:Response, next:NextFunction)=> {
	// console.log(error);
	const status = error.statusCode || 500;
	const message = error.message;
	return res.status(status).json({message:message});
});

mongoose.connect('mongodb+srv://khalid93waleed:lammkopf@clusternodejs.8dgcznv.mongodb.net/Messages')
.then(result => {
	// console.log(result);
	const server = app.listen(8080);
	const io = socket.init(server);
	io.on('connection', (socket) => {
		console.log('Client connected');
		
	})
})
.catch(err => console.log(err));

// app.listen(8080, () => {
    
// });