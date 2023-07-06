import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Post } from "../models/post";
import { User } from "../models/user";
import fs from 'fs';
import path from "path";
import { Types } from "mongoose";
import { socket } from '../../socket';
export const getPosts = async (req: Request, res:Response, next: NextFunction ) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;
	let totalItems:number;

	try {
		totalItems = await Post.find().countDocuments();
		const posts = await Post.find().populate('creator').sort({createdAt:-1}).skip((Number(currentPage)-1)*perPage).limit(perPage);
		
		res.status(200).json({
			message:'Posts fetched successfully.',
			posts:posts,
			totalItems
		})
	} catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError)
	}
}

export const createPost =  async (req: Request, res:Response, next: NextFunction ) => {
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		const error = new Error('Validation failed');
		error.statusCode = 422;
		next(error);
		return
	}
	if(!req.file){
		const error = new Error('No image provided.');
		error.statusCode = 422;
		throw error;
	}
	// const imageUrl = req.file.path
	const imageUrl = req.file.path.replace("\\" ,"/"); //for windows
	const title = req.body.title;
	const content = req.body.content;
	const post = new Post({
		title:title, content: content, creator:req.userId, imageUrl:imageUrl
	})
	try {
		const createdPost = await post.save();
		const user = await User.findById(req.userId);
		if(!user){
			const error = new Error('Not Auhtenticated');
			error.statusCode = 401;
			throw error;
		}
		user.posts.push(createdPost._id);
		await user.save();
		socket.getIO().emit('posts', { action:'create', post:{...post.toObject(), creator: { _id:req.userId, name:user.name }}})
		res.status(201).json({
			message:'Post created successfully!',
			post:createdPost,
			creator: {
				_id: user._id, 
				name: user.name
			}
	})
	} catch (error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
}
export const getPost = async (req: Request, res:Response, next: NextFunction) => {
	const postId = req.params.postId;
	try{
		const post = await Post.findById(postId).populate('creator');
		if(!post){
			const error = new Error('Could not find post.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({
			message: 'Post fetched.',
			post:post
		})
	} catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
}

export const editPost = async (req: Request, res:Response, next: NextFunction ) => {
	const postId = req.params.postId;
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		const error = new Error('Validation failed');
		error.statusCode = 422;
		next(error);
		return
	}
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;
	if(req.file){
		imageUrl = req.file.path.replace("\\" ,"/");
	}
	if(!imageUrl){
		const error = new Error('No file picked');
		error.statusCode= 422;
		next(error);
		return
	}
	try {
		const post = await Post.findById(postId).populate('creator');
		if(!post){
			const error = new Error('Could not find post.');
			error.statusCode = 404;
			throw error;
		}
		if(post.creator._id.toString() !== req.userId){
			const error = new Error('Not authorized');
			error.statusCode = 403;
			throw error;
		}
		if(imageUrl !== post.imageUrl){
			clearImage(post.imageUrl);
		}
		post.title = title;
		post.content = content;
		post.imageUrl = imageUrl;
		const result = await post.save();
		socket.getIO().emit('posts', { action:'update', post: result })
		res.status(200).json({
			message:'Post updated!',
			post:result
		});
	} catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}

}
export const deletePost = async (req: Request, res:Response, next: NextFunction ) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if(!post){
			const error = new Error('Could not find post.');
			error.statusCode = 404;
			throw error;
		}
		if(post.creator.toString() !== req.userId){
			const error = new Error('Not authorized');
			error.statusCode = 403;
			throw error;
		}
		// clearImage(post.imageUrl);
		// await Post.findByIdAndRemove(postId);
		// socket.getIO().emit('posts', { action:'delete', post:postId})

		const user = await User.findById(req.userId);
		if(!user){
				const error = new Error('Not Authenticated');
				error.statusCode = 401;
				throw error;
		}
		(user.posts as Types.DocumentArray<Types.ObjectId>).pull(postId);

		await Post.findByIdAndRemove(postId);
		await user.save();
		
		clearImage(post.imageUrl);

		socket.getIO().emit('posts', { action:'delete', post:postId})

		res.status(200).json({
			message:'Post is deleted successfully!'
		});
	}
	catch(error) {
		let castedError = error as Error;
		if(!castedError.statusCode)
			castedError.statusCode = 500;
		next(castedError);
	}
}
const clearImage = (filePath:string) => {
	filePath = path.join(__dirname, '..', '..', filePath);
	fs.unlink(filePath, err => err?console.log(err):null);
}

