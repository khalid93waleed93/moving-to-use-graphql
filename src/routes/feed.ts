import  Express  from "express";
import * as feedController from "../controller/feed";
import { body } from 'express-validator';
import { isAuth } from "../middleware/isAuth";
const router = Express.Router();

router.get('/posts', isAuth,feedController.getPosts);

router.post('/post', isAuth,[
	body('title').trim().isLength({min:5}),
	body('content').trim().isLength({min:5})
],feedController.createPost);

router.get('/post/:postId', isAuth,feedController.getPost);

router.put('/post/:postId', isAuth,[
	body('title').trim().isLength({min:5}),
	body('content').trim().isLength({min:5})
], feedController.editPost);

router.delete('/post/:postId', isAuth,feedController.deletePost);

export { router }