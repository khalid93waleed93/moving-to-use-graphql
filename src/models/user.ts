import mongoose from "mongoose";
import { Schema } from "mongoose";
const userSchema = new Schema({
	email: {
		type: String,
		required: true
	},
	password: {
		type:String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	status: {
		type: String,
		default: 'I am new!'
	},
	posts: [
		{
		 type: Schema.Types.ObjectId,
		 ref: 'post'
	  }
	]
});

export const User = mongoose.model('user',userSchema)