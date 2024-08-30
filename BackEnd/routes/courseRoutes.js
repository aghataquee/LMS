import {Router } from 'express';
import isloggedin from '../middlewares/isloggedin.js'
import {getAllcourses,getAlllectures} from '../controller/coursecontroller.js';
const router=Router();
router.route('/').get(getAllcourses);
router.route('/:id').get(isloggedin,getAlllectures);