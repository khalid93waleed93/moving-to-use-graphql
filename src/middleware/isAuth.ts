import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";


interface JwtPayloadWithUserId extends JwtPayload {
	userId?: string;
}
export const isAuth = (req: Request, res:Response, next: NextFunction ) => {
	const authHeader = req.get('Authorization');
	if(!authHeader){
		const error = new Error('Token not found');
		error.statusCode = 404;
		throw error;
	}
	const token = authHeader.split(' ')[1];
	let decodedToken: string | JwtPayloadWithUserId;;
	try {
		decodedToken = jwt.verify(token,'secret') as JwtPayloadWithUserId;
	} catch(error){
		let castedError = error as Error;
		castedError.statusCode = 500;
		throw castedError;
	}
	if(!decodedToken){
		const error = new Error('Not authenticated.');
		error.statusCode = 401;
		throw error;
	}
	req.userId = decodedToken.userId;
	next()
}