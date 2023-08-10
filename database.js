// Create an object to store user information

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};
// Create an empty object to store URL information

const urlDatabase = {};

/* how the structure of urlDatabase should look like
  const urlDatabase = {
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
// Export the users and urlDatabase objects for use in other files

module.exports = {
  users,
  urlDatabase,
};