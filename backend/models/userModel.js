import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true
    },
    email :{
        type : String,
        require:true
    },
    password:{
        type:String,
        required:true
    },
    createdAt: {
        type: Date,
        default: new Date(),
  },
});

const UserModel = mongoose.model("UserModel",UserSchema);
export default UserModel;

