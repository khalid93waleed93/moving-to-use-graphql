import { NextFunction, Request, Response } from "express";
import { User } from "../models/user";
import { validationResult } from "express-validator";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
export const signup = async (req: Request, res:Response, next: NextFunction ) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		const error = new Error('Validation failed!');
		error.statusCode = 422;
		next(error);
		return
	}
	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;
	try {
		const hashedPassword = await bcrypt.hash(password,12);
		const user = new User({
			name:name,
			password:hashedPassword,
			email:email
		});
		const createdUser = await user.save();
		res.status(201).json({
			message:'User created!',
			userId: createdUser._id
		});
	} catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
}
export const login = async (req: Request, res:Response, next: NextFunction ) => {
	const email = req.body.email;
	const password = req.body.password;
	try {
		const user = await User.findOne({email:email});
		if(!user){
			const error = new Error('There is no user with this email.');
			error.statusCode = 404;
			throw error;
		}
		const isAuth = await bcrypt.compare(password,user.password);
		if (!isAuth) {
			const error = new Error('Wrong Password!');
			error.statusCode = 401;
			throw error;
		}
		const token = jwt.sign({email: user.email, userId:user._id.toString()},'secret',{expiresIn:'1h'})
		res.status(200).json({token: token, userId: user._id.toString()})
	} catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
}
export const getUserStatus = async (req: Request, res:Response, next: NextFunction ) => {
	try {
		const user = await User.findById(req.userId);
		if(!user){
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({ status: user.status })
	} catch (error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
	
}
export const editUserStatus = async (req: Request, res:Response, next: NextFunction ) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		const error = new Error(errors.array()[0].msg);
		error.statusCode = 422;
		next(error);
		return
	}
	const newStatus = req.body.status;
	try {
		const user = await User.findById(req.userId);
		if(!user){
			const error = new Error('User not found');
			error.statusCode = 404;
			throw error;
		}
		user.status = newStatus;
		await user.save()
		res.status(200).json({ message:'User updated.' })
	} catch (error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
	
}