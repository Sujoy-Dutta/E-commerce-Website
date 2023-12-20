const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

const User = require('../models/user');
const { check, body } = require('express-validator');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
    body('email')
        .isEmail()
        .withMessage("Please enter a valid email address."),
        // .normalizeEmail(),
    body('password','Password has to be valid.')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim()
    ],
     authController.postLogin);

router.post(
    '/signup', 
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email!')
            .custom((value, {req})=>{
                // if(value === "test@test.com"){
                //     throw new Error("This email address if forbidden");
                // }
                // return true;

                return User.findOne({email: value})
                .then(userDoc =>{
                    if(userDoc){
                        return Promise.reject('E-Mail exists already, please choose a different email.');
                    }
                })
            })
            .normalizeEmail(),
        body('password', 'Please enter a password with only numbers and text and at least 5 characters')
            .isLength({min: 5})
            .isAlphanumeric()
            .matches('[0-9]').withMessage('Password Must Contain a Number')
            .matches('[A-Z]').withMessage('Password Must Contain an Uppercase Letter')
            .trim(),
        body('confirmPassword')
            .trim()    
            .custom((value, {req})=>{
                if(value !== req.body.password){
                    throw new Error('Password have to match!');
                }
                return true;
            })
        ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;