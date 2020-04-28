const path = require("path");
const router = require("express").Router();
var axios = require("axios");
var cheerio = require("cheerio");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");
const PinterestStrategy = require("passport-pinterest");
const querystring = require("querystring");

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const db = require("../models");
const redirect_uri = "http://localhost:3000";
const credentials = {
  client: {
    id: "5073939286663940267",
    secret: "f88681c57f7d8613522b1f09272c106f1fb1366e1464c80a8718442a19e8d743"
  },
  auth: {
    tokenHost: "https://api.pinterest.com/oauth/"
  }
};
router.get("/pinterest", (req, res) => {
  console.log("hey");
  passport.authenticate("pinterest");

  // const oauth2 = require('simple-oauth2').create(credentials);

  // const authorizationUri = oauth2.authorizationCode.authorizeURL({
  //   response_type: 'code',
  //   redirect_uri: 'http://localhost:3000/callback',
  //   scope: 'read_public,write_public',
  //   state: '768uyFys'
  // })
  // res.redirect(authorizationUri)
});
router.get(
  "/pinterest/callback",
  passport.authenticate("pinterest", { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);
// If no API routes are hit, send the React app
router.get("/recipes/:id", (req, res) => {
  console.log(req.params.id);
  let decodedUrl = decodeURIComponent(req.params.id);
  console.log(decodedUrl);
  axios.get(decodedUrl).then(function(response) {
    var ingredientData = [];
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element that has a class of wprm-recipe-ingredient
    $(".wprm-recipe-ingredient").each(function(i, element) {
      var result = {};
      result.amount = $(this)
        .find(".wprm-recipe-ingredient-amount")
        .text();
      result.unit = $(this)
        .find(".wprm-recipe-ingredient-unit")
        .text();
      result.name = $(this)
        .find(".wprm-recipe-ingredient-name")
        .text();
      console.log(result);
      ingredientData.push(result);
    });
    // Send a ingredientData back as an array of objects back to the browser
    res.json(ingredientData);
  });
});
router.post("/shoppingListItem", function(req, res) {
  const { newIngredient, userId } = req.body;
  console.log("Adding Item to Shopping List");
  console.log(req.body);
  console.log(newIngredient);
  console.log(userId);
  db.User.updateOne({ _id: userId }, { $push: { shoppingList: newIngredient } })
    .then(newItem => {
      console.log("New Shopping List Item", newItem);
      res.json({
        message: "Successfully created",
        error: false,
        data: newItem
      });
    })
    .catch(err => {
      console.log(err);
      res.json({
        message: err.message,
        error: true
      });
    });
});
router.post("/fridgeItem", function(req, res) {
  const { newIngredient, userId } = req.body;
  console.log("Adding Item to Fridge");
  console.log(req.body);
  console.log(newIngredient);
  console.log(userId);
  db.User.updateOne({ _id: userId }, { $push: { fridge: newIngredient } })
    .then(newItem => {
      console.log("New Fridge Item", newItem);
      res.json({
        message: "Successfully created",
        error: false,
        data: newItem
      });
    })
    .catch(err => {
      console.log(err);
      res.json({
        message: err.message,
        error: true
      });
    });
});
router.put("/fridgeItem", function(req, res) {
  const { itemName, userId } = req.body;
  console.log(req.body);
  db.User.update({ _id: userId }, { $pull: { fridge: { name: itemName } } })
    .then(removedItem => {
      console.log("Removed Fridge Item", removedItem);
      res.json({
        message: "Successfully removed",
        error: false,
        data: removedItem
      });
    })
    .catch(err => {
      console.log(err);
      res.json({
        message: err.message,
        error: true
      });
    });
});
router.get("/getFridge/:id", (req, res) => {
  console.log("Retrieving Fridge Data...");
  const userID = req.params.id;
  console.log(req.params);
  console.log(userID);
  db.User.findById(userID, "fridge")
    .then(allItems => {
      res.json({
        message: "Requested all Fridge Items",
        error: false,
        data: allItems
      });
    })
    .catch(err => {
      console.log(err);
      res.json({
        message: err.message,
        error: true
      });
    });
});
router.get("/getShoppingList/:id", (req, res) => {
  console.log("Retriving Shopping List Data...");
  const userID = req.params.id;
  console.log(req.params);
  console.log(userID);
  db.User.findById(userID, "shoppingList")
    .then(allItems => {
      res.json({
        message: "Requested Shopping List",
        error: false,
        data: allItems
      });
    })
    .catch(err => {
      console.log(err);
      res.json({
        message: err.message,
        error: true
      });
    });
});
router.post("/register", (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  db.User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      console.log("user exist");
      return res.status(400).json({ email: "Email already exists" });
    } else {
      console.log("user does not exist");

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        fridge: [],
        shoppingList: []
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  db.User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

// router.use(function(req, res) {
//   res.sendFile(path.join(__dirname, "../client/build/index.html"));
// });

module.exports = router;
