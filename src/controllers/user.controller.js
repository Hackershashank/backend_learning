import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import {User} from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })


    // get user details from frontend

    //input from postman---post---raw---json
    // {
    //     "email": ss14370@gmail.com,
    //     password:""
    // }
    const {fullName,email,username,password}=req.body
    console.log("email",email);


    // validation - not empty
    if(
        [fullName,email,username,password].some(()=>
            fields?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }

    // check if user already exists: username, email
    const existedUser = User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists");
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    // upload them on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required");
    }


    // create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // remove password and refresh Token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if(createdUser){
        throw new ApiError(500,"Something wet wrong while registering the user"); 
    }
    
    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

export {registerUser}