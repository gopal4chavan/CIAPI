const router = require('express').Router();

const usersController = require('../controllers').users;
const calendarController = require('../controllers').calendars;

const userMiddleware = require('../middlewares').user;
const authMiddleware = require('../middlewares').auth;
// const calendarMiddleware = require('../middlewares').calendar;


// method:  post
// url:     api/v1/user/create
// header:  x-access-token, content-type
// params:  firstname,lastname,email,password=
// sample request
// {
//    "firstname":"gopal"
//    "lastname":"chavan"
//    "email":"gopal.chavan+ic@ggktech.com"
//    "password":"gopal"
// }
// sample response
// {
//    "user": {
//       "id": 1,
//       "firstname": "gopal",
//       "lastname": "chavan",
//       "email": "gopal.chavan+ic@ggktech.com",
//    },
//    "token": "token"
// }
router.route('/user/create').post( userMiddleware.validateUserDetails,
                              userMiddleware.newUser, 
                              authMiddleware.generateToken,
                              usersController.create);


// method:    post
// url:       api/v1/user/login
// header:    x-access-token, content-type
// params:    email, password
// sample request
// {
//   "email":"gopal.chavan+ic@ggktech.com"
//   "password":"gopal"
// }
// sample response
// {
//   "token": "token"
// }
router.route('/user/login').post( userMiddleware.findUser,
                            userMiddleware.validatePassword,
                            authMiddleware.generateToken,
                            usersController.login);

// method:    post
// url:       api/v1/user/details
// header:    x-access-token
// sample response
// {
//    "user": {
//       "id": 1,
//       "firstname": "gopal",
//       "lastname": "chavan",
//       "email": "gopal.chavan+ic@ggktech.com"
//    }
// }
router.route('/user/details').get( authMiddleware.authenticateUser,
                                   usersController.userDet);


// method:    get
// url:       api/v1/authorise_google?token=token
// Flow:      Redirect's to google auth page,
//            after auth, google redirect's back to google_callback route
//  TODO : updates routes to have /calendar for calendar realted routes
router.route('/authorise_google').get( authMiddleware.authenticateUser,
                                                calendarController.googleAuthorise);

router.route('/google_callback').get( authMiddleware.authenticateUser,
                                               calendarController.googleCallback );

// method:    get
// url:       api/v1/authorise_outlook?token=token
// Flow:      Redirect's to outlook auth page,
//            after auth, outlook redirect's back to outlook_callback route
router.route('/authorise_outlook').get( authMiddleware.authenticateUser,
                                                 calendarController.outlookAuthorise);

router.route('/outlook_callback').get( authMiddleware.authenticateUser,
                                                calendarController.outlookCallback );

// method:    get
// url:       api/v1/calendars/sync_calendars
// header:    x-access-token
// params:    --
// sample response
// {
//    "message": "syncing events"
// }
router.route('/calendars/sync_calendars').get( authMiddleware.authenticateUser,
                                                calendarController.syncCalendars);

module.exports = router