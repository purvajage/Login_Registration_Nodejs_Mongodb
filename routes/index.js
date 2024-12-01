const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Entry point: Render login.ejs at root route
router.get('/', (req, res) => {
  return res.render('login.ejs');
});

// Registration Page
router.get('/register', (req, res) => {
  return res.render('register.ejs');
});

// Registration Logic
router.post('/register', async (req, res) => {
  try {
    const personInfo = req.body;

    if (!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf) {
      return res.send({ Error: "All fields are required." });
    }

    if (personInfo.password !== personInfo.passwordConf) {
      return res.send({ Error: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email: personInfo.email });
    if (existingUser) {
      return res.send({ Error: "Email is already registered." });
    }

    const lastUser = await User.findOne().sort({ unique_id: -1 }).limit(1);
    const newId = lastUser ? lastUser.unique_id + 1 : 1;

    const newUser = new User({
      unique_id: newId,
      email: personInfo.email,
      username: personInfo.username,
      password: personInfo.password,
      passwordConf: personInfo.passwordConf,
    });

    await newUser.save();
    return res.send({ Success: "You are registered. You can login now." });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ Error: "Internal Server Error" });
  }
});

// Login Logic
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.send({ Error: "This email is not registered." });
    }

    if (user.password !== password) {
      return res.send({ Error: "Incorrect password." });
    }

    req.session.userId = user.unique_id;
    return res.send({ Success: "Login successful!" });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ Error: "Internal Server Error" });
  }
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send({ Error: "Logout failed." });
      }
      return res.redirect('/');
    });
  }
});

// Password Reset Page
router.get('/forgetpass', (req, res) => {
  return res.render('forget.ejs');
});

// Password Reset Logic
router.post('/forgetpass', async (req, res) => {
  try {
    const { email, password, passwordConf } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.send({ Error: "This email is not registered." });
    }

    if (password !== passwordConf) {
      return res.send({ Error: "Passwords do not match." });
    }

    user.password = password;
    user.passwordConf = passwordConf;

    await user.save();
    return res.send({ Success: "Password changed!" });

  } catch (error) {
    console.error(error);
    return res.status(500).send({ Error: "Internal Server Error" });
  }
});

module.exports = router;
