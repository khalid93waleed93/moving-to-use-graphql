import  Express  from "express";
import * as authController from "../controller/auth";
import { body } from 'express-validator'
import { User } from "../models/user";
import { isAuth } from "../middleware/isAuth";
const router = Express.Router();

router.put('/signup',
[
	body('email').isEmail().withMessage('please enter a valid email.')
	.custom( async (value,{req})=> {
		const userDoc = await User.findOne({email:value});
		if(userDoc)
			return Promise.reject('E-Mail address already exists');
		return
	})
	.normalizeEmail(),
	body('password').trim().isLength({min:5}),
	body('name').trim().not().isEmpty()
],
authController.signup);

router.post('/login',authController.login);

router.get('/status', isAuth, authController.getUserStatus);

router.patch('/status', isAuth, [
	body('status').trim().not().isEmpty().withMessage('Status cannot be empty')
],authController.editUserStatus);

export { router }