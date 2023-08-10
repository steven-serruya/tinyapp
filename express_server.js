// Import required modules and set up the server

const express = require("express");
const app = express();
const PORT = 8080;
const { generateRandomString, getUserById, getUserByEmail, urlsForUser } = require("./helpers");
const { users, urlDatabase } = require("./database");
const bcrypt = require("bcryptjs");


//set the view engine to EJS 
app.set("view engine", "ejs");
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Middleware to parse URL-encoded data in request bodies

app.use(express.urlencoded({ extended: true }));


// Root route

app.get("/", (req, res) => {
  // Check if the user is logged in
  if (getUserById(req.cookies.userId, users)) {
    // If logged in, redirect to /urls
    return res.redirect("/urls");
  } else {
    // If not logged in, redirect to /login
    return res.redirect("/login");
  }
});

// Redirect short URLs to their corresponding long URLs

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<html><body>URL not found!</body></html>");
  }
});

// Display URLs associated with a logged-in user

app.get("/urls", (req, res) => {
  // Get user using their cookie-based userId
  const user = getUserById(req.cookies.userId, users);

  if (!user) {
    return res.render("urls_not_logged_in");
  }

  // Filter URLs to show only those associated with the logged-in user

  const userURLs = urlsForUser(user.id);
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === user.id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  const templateVars = {
    user: user,
    urls: userURLs
  };
  res.render("urls_index", templateVars);
});

// Route to return the URL database in JSON format

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Route to display a simple HTML page

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



// Route to display a form for creating a new URL

app.get("/urls/new", (req, res) => {
  const user = getUserById(req.cookies.userId, users);
  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: user,
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});

// Display details of a specific URL

app.get("/urls/:id", (req, res) => {
  const user = getUserById(req.cookies.userId, users);
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  // Check if the user is logged in

  if (!user) {
    return res.status(401).send("<html><body>You must be logged in to access this page.</body></html>");

  }

  // Check if the URL exists and the user is authorized to view it

  if (!longURL || longURL.userID !== user.id) {
    return res.status(404).send("<html><body>URL not found!</body></html>");

  }
  const templateVars = {
    user: user,
    id: shortURL,
    longURL: longURL.longURL
  };
  res.render("urls_show", templateVars);
});

// Create a new short URL

app.post("/urls", (req, res) => {
  const user = getUserById(req.cookies.userId, users);

  if (!user) {
    return res.status(403).send("You must be logged in to create URLs.");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.userId,
  };

  res.redirect(`/urls/${shortURL}`);
});

// Update the long URL of an existing short URL

app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  const id = req.params.id;
  if (urlDatabase[id]) {
    urlDatabase[id].longURL = newLongURL;
    res.redirect("/urls");
  }
});

// Delete a URL from the database

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found.");
  } else if (urlDatabase[id]) {
    delete urlDatabase[id];
  }
  res.redirect("/urls");
});

// Update the long URL of an existing URL

app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  if (urlDatabase[id].longURL) {
    urlDatabase[id].longURL = newLongURL;
    res.redirect(`/urls/${id}`);
  }
});


// User login

app.post("/login", (req, res) => {

  // Check user credentials
  const email = req.body.email;
  const password = req.body.password;
  const existingUser = getUserByEmail(email, users);

  if (!existingUser) {
    return res.status(403).send("Email cannot be found!");

  }
  // Compare the provided password with the hashed password using bcrypt
  if (!bcrypt.compareSync(password, existingUser.password)) {
    return res.status(403).send("Incorrect password!");
  }


  res.cookie("userId", existingUser.id);   // Set a cookie for the logged-in user
  res.redirect("/urls"); //redirect to "/urls"
});

// User logout

app.post("/logout", (req, res) => {
  res.clearCookie("userId");   // Clear cookie
  res.redirect("/login"); //redirect to "login"
});


// User registration page

app.get("/register", (req, res) => {
  const user = getUserById(req.cookies.userId, users);

  if (user) {
    return res.redirect("/urls");
  }

  res.render("user_registration", { user: user });
});


// Check if the email is already registered

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("Email and password are required!");
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.status(400).send("Email is already in use!");
  }

  // Hash the password using bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create a new user and save the hashed password
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };

  res.cookie("userId", userId);
  console.log(users);
  res.redirect("/urls"); //redirect to "/urls"
});

// User login page

app.get("/login", (req, res) => {
  if (getUserById(req.cookies.userId, users)) {
    return res.redirect("/urls");
  }

  res.render("login");
});

// Start the server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});