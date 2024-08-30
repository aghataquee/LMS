import Course from '../model/course.schema.js'
exports.getAllcourses=async (req,res,next)=>{
    try{
        const courses=await Course.find({}).select('-lectures');
        res.status(200).json({
            success:true,
            message:"All courses fetched",
            courses
        })
    }catch(e){
        return next(new AppError(e.message,404));
    }

}
exports.CreateCourse=async (req,res,next)=>{
    const {title,description,category,createdBy}=req.body;
    if(!title||!description||!category||!createdBy){
        return next(new AppError("All fields are required",404));
    }
    try{
        const course=await Course.create({
            title,
            description,
            category,
            createdBy
        });
        if(!course){
            return next(new AppError("course not created",400));
        }
        if(req.file){
            const result=cloudinary.v2.uploader.upload(req.file.path,{
                folder:"lms"
            });
            if(result){
                course.thumbnail.public_id=result.public_id;
                course.thumbnail.public_url=result.public_url;
            }
            fs.rm(`remove ${req.file.filename}`);
        }
        await course.save();
        res.status(200).json({
            success:true,
            message:"Course created successfully",
            course
        })

    }
    catch(error){
        for (const file of await fs.readdir('uploads/')) {
            await fs.unlink(path.join('uploads/', file));
          }
    
          // Send the error message
          return next(
            new AppError(
              JSON.stringify(error) || 'File not uploaded, please try again',
              400
            )
          );
    }
    

}
// adding lectures to the course
exports.createlectures=async (req,res,next)=>{
    const {title,description}=req.body;
    const {id}=req.params;
    let lecturedata={};
    if(!title){
        return next(new AppError("title is required",404));
    }
    if(!description){
        return next(new AppError("description is required",404));
    }
    const course=await Course.findById(id);
    if(!course){
        return next(new AppError("course doesn't exist",404));
    }
    if(req.file){
        try{
            const result=cloudinary.v2.uploader.upload(req.file.path,{
                folder:"lms",
                chunk_size:50000,
                resource_type:"video"
            });
            if(result){
                lecturedata.public_id=result.public_id;
                lecturedata.public_url=result.public_url;
            }
            fs.rm(`uploads ${req.file.filename}`);
        }
        catch(error){
            for (const file of await fs.readdir('uploads/')) {
                await fs.unlink(path.join('uploads/', file));
              }
        
              // Send the error message
              return next(
                new AppError(
                  JSON.stringify(error) || 'File not uploaded, please try again',
                  400
                )
              );
        }
    }
    course.lectures.push({
        title,
        description,
        lecture:lecturedata
    });
    course.numberOfLectures = course.lectures.length;

    // Save the course object
    await course.save();
  
    res.status(200).json({
      success: true,
      message: 'Course lecture added successfully',
      course,
    });

}
exports.getAlllectures=async (req,res,next)=>{
    const {id}=req.params;
    try{
        const courselectures=await Course.findById(id);
        if(!courselectures){
            return next(new AppError("Invalid id"),404);
        }
        res.status(200).json({
            success:true,
            message:"All lectures fetched successfully",
            courselectures:Course.lectures
        })
    }catch(e){
        return next(new AppError(e.message,400));
    }

}

exports.removelectures=async (req,res,next)=>{
    const {course_id,lecture_id}=req.query;
    if(!course_id){
        return next(new AppError("course doesn't exists",404));
    }
    if(!lecture_id){
        return next(new AppError("lecture doesn't exists",403));
    }
    const course=await Course.findById(course_id);
    if(!course){
        return next(new AppError("course doesn't exists",400));
    }
    const lectureIndex=course.lectures.findindex(
        (lecture)=>lecture._id.toString()===lecture_id.toString()
    )
    if (lectureIndex === -1) {
        return next(new AppError('Lecture does not exist.', 404));
      }
    
      // Delete the lecture from cloudinary
      await cloudinary.v2.uploader.destroy(
        course.lectures[lectureIndex].lecture.public_id,
        {
          resource_type: 'video',
        }
      );
    
      // Remove the lecture from the array
      course.lectures.splice(lectureIndex, 1);
    
      // update the number of lectures based on lectres array length
      course.numberOfLectures = course.lectures.length;
    
      // Save the course object
      await course.save();
    
      // Return response
      res.status(200).json({
        success: true,
        message: 'Course lecture removed successfully',
      });
}
export const updateCourseById = asyncHandler(async (req, res, next) => {
    // Extracting the course id from the request params
    const { id } = req.params;
  
    // Finding the course using the course id
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: req.body, // This will only update the fields which are present
      },
      {
        runValidators: true, // This will run the validation checks on the new data
      }
    );
  
    // If no course found then send the response for the same
    if (!course) {
      return next(new AppError('Invalid course id or course not found.', 400));
    }
  
    // Sending the response after success
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
    });
  });
  
  /**
   * @DELETE_COURSE_BY_ID
   * @ROUTE @DELETE {{URL}}/api/v1/courses/:id
   * @ACCESS Private (Admin only)
   */
  export const deleteCourseById = asyncHandler(async (req, res, next) => {
    // Extracting id from the request parameters
    const { id } = req.params;
  
    // Finding the course via the course ID
    const course = await Course.findById(id);
  
    // If course not find send the message as stated below
    if (!course) {
      return next(new AppError('Course with given id does not exist.', 404));
    }
  
    // Remove course
    await course.remove();
  
    // Send the message as response
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  });
  