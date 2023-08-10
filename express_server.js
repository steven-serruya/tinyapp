const express = require("express");
const app = express();
const PORT = 8080;
const { generateRandomString, getUserById, getUserByEmail } = require("./helpers");
const { users, urlDatabase } = require("./database");

app.set("view engine", "ejs");
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// const users = {
//   userRandomID: {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur",
//   },
//   user2RandomID: {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "dishwasher-funk",
//   },
// };



// const urlDatabase = {};

/* const urlDatabase = {
  shortURL: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};
*/


app.use(express.urlencoded({ extended: true }));



app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<html><body>URL not found!</body></html>");
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = getUserById(req.cookies.userId, users);

  if (!user) {
    return res.render("urls_not_logged_in");
  }

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

app.get("/urls/:id", (req, res) => {
  const user = getUserById(req.cookies.userId, users);
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!user) {
    return res.render("urls_not_logged_in");
  }

  if (!longURL || longURL.userID !== user.id) {
    return res.status(404).render("urls_not_found");
  }
  const templateVars = {
    user: user,
    id: shortURL,
    longURL: longURL.longURL
  };
  res.render("urls_show", templateVars);
});

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
app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  const id = req.params.id;
  if (urlDatabase[id]) {
    urlDatabase[id].longURL = newLongURL;
    res.redirect("/urls");
  }
});
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("URL not found.");
  } else if (urlDatabase[id]) {
    delete urlDatabase[id];
  }
  res.redirect("/urls");
});
app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  if (urlDatabase[id].longURL) {
    urlDatabase[id].longURL = newLongURL;
    res.redirect(`/urls/${id}`);
  }
});



app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const existingUser = getUserByEmail(email, users);

  if (!existingUser) {
    return res.status(403).send("Email cannot be found!");

  }
  if (password !== existingUser.password) {
    return res.status(403).send("Incorrect password!");
  }


  res.cookie("userId", existingUser.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const user = getUserById(req.cookies.userId, users);

  if (user) {
    return res.redirect("/urls");
  }

  res.render("user_registration", { user: user });
});



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
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: password
  };

  res.cookie("userId", userId);
  console.log(users);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (getUserById(req.cookies.userId, users)) {
    return res.redirect("/urls");
  }

  res.render("login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});