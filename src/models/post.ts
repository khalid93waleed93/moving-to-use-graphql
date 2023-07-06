import mongoose from "mongoose";
import { Schema } from "mongoose";
const postSchema = new Schema({
	title: {
		type: String,
		required: true
	},
	imageUrl: {
		type:String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	creator: {
		type: Schema.Types.ObjectId,
		required: true,
		ref:'user'
	}
},{ timestamps: true});

export const Post = mongoose.model('post',postSchema)