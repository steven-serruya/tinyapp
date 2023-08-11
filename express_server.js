// Import required modules and set up the server

const express = require("express");
const app = express();
const PORT = 8080;
const { generateRandomString, getUserById, getUserByEmail, urlsForUser } = require("./helpers");
const { users, urlDatabase } = require("./database");
const bcrypt = require("bcryptjs"); // Import bcriptjs
const cookieSession = require("cookie-session"); // Import cookie-session


//set the view engine to EJS 
app.set("view engine", "ejs");

// use of cookieSession
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'] // Provide secret keys for encryption
}));

app.use(express.urlencoded({ extended: true }));
// Root route

app.get("/", (req, res) => {
  // Check if the user is logged in
  if (getUserById(req.session.userId, users)) {
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
  const user = getUserById(req.session.userId, users);

  if (!user) {
    const redirectToLogin = encodeURIComponent("/login");
    return res.render("error_logged_in", { errorMessage: "You must be logged in to access this page." });
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
  const user = getUserById(req.session.userId, users);
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
  const user = getUserById(req.session.userId, users);
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  // Check if the user is logged in

  if (!user) {
    return res.render("error_logged_in", { errorMessage: "You must be logged in to access this page." });

  }

  // Check if the URL exists and the user is authorized to view it

  if (!longURL || longURL.userID !== user.id) {
    return res.render("error_url_not_exist", { errorMessage: "The URL you are looking for does not exist" });

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
  const user = getUserById(req.session.userId, users);

  if (!user) {
    return res.status(403).send("You must be logged in to create URLs.");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userId,
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

// Handle both GET and POST requests for deleting URLs
app.all("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.render("error_url_not_exist", { errorMessage: "The URl does not exist!" });
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

// User login page

app.get("/login", (req, res) => {
  if (getUserById(req.session.userId, users)) {
    return res.redirect("/urls");
  }

  res.render("login");
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


  req.session.userId = existingUser.id; // Set the user_id in the session
  res.redirect("/urls"); //redirect to "/urls"
});

// User logout

app.post("/logout", (req, res) => {
  req.session = null; // Clear the session
  res.redirect("/login"); //redirect to "login"
});


// User registration page

app.get("/register", (req, res) => {
  const user = getUserById(req.session.userId, users);

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
    return res.render("error_email_password_req", { errorMessage: "Email and password are required!" });
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    return res.render("error_email_in_use", { errorMessage: "Email is already in use!" });
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
  res.redirect("/login"); //redirect to "/urls"
});



// Start the server

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});