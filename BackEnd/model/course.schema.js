import {model,Schema} from mongoose;
const courseSchema=new Schema({
    title:{
        type:String,
        required:[true,"Title is required"],
        minLength:[6,"Title should must be atleast of 6 characters"],
        maxLength:[60,"Name should be lesser than 60 characters"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Description is required"],
        minLength:[6,"Desc should must be atleast of 6 characters"],
        maxLength:[250,"Description should be lesser than 60 characters"],
        trim:true

    },
    category:{
        type:String,
        required:true
    },
    thumbnail:{
        public_id:{
            type:String,
            required:true
        },
        secure_url:{
            type:String,
            required:true
        }
    },
    lectures:{
        lecture:[{
            title:{
                type:String,
                required:[true,"title of lecture is required"]
            },
            public_id:{
                type:String,
                required:true
            },
            secure_url:{
                type:String,
                required:true
            },
            created_by:{
                type:String,
                required:true
            }
        }]
    },
    noOflectures:{
        type:Number
    }
},
{
    timestamps:true
})
const coursemodel=model('Course',courseSchema);
export default coursemodel;