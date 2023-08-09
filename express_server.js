const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const generateRandomString = () => {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    result += alphanumericChars[randomIndex];
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
app.use(express.urlencoded({ extended: true }));

app.post("/urls", (req, res) => {
  console.log(req.body);
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("URL not found!");
  }
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies.username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies.username
  };
  res.render("urls_show", templateVars);
});
app.post("/urls/:id", (req, res) => {
  const newLongURL = req.body.newLongURL;
  const id = req.params.id;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
    res.redirect("/urls");
  }
});
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (urlDatabase[id]) {
    delete urlDatabase[id];
  }
  res.redirect("/urls");
});
app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  if (urlDatabase[id]) {
    urlDatabase[id] = newLongURL;
    res.redirect(`/urls/${id}`);
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies.username,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});
