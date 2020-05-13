const jwt = require("jwt-simple");
const validateRegisterInput = require("../validation/register");
const User = require("../models/User");

function tokenForUser(user) {
  const timestamp = new Date().getTime();
  return jwt.encode({ sub: user.id, iat: timestamp }, process.env.secret);
}

exports.login = (req, res) => {
  //User has already had their email and password auth'd
  //We just need to give them a token
  res.send({ token: tokenForUser(req.user), userData: req.user });
};
exports.register = (req, res) => {
  const { name, email, password } = req.body;

  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  // See if a user with the given email exists
  User.findOne({ email: email }, function(err, existingUser) {
    if (err) {
      return next(err);
    }
    //If a user with email does exist, return an error
    if (existingUser) {
      return res.status(422).send({ error: "Email is already in use" });
    }
    const user = new User({
      name: name,
      email: email,
      password: password,
    });
    user.save(function(err) {
      if (err) {
        return next(err);
      }
      //respond to the request indicating User was created
      res.json({ token: tokenForUser(user) });
    });
  });
};
exports.storeAuthCode = (req, res) => {
  User.update({_id: req.body.userId},{pinterestCode: req.body.pinterestAuthCode}).then(response => console.log(response))
  console.log(req.body)
};
exports.loadUser = (req, res) => {
  User.findById(req.params.id)
    .select('-password')
    .then(user => res.json(user));
}
