// helpers.js

// here is the function to generate a random string:
const generateRandomString = () => {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = "";
  for (let i = 0; i < 6; i++) {
    let randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    result += alphanumericChars[randomIndex];
  }
  return result;
};
// here is the function to get the User by the id
const getUserById = (id, database) => {
  return database[id];
};
// here is the function to the the user by the email;
const getUserByEmail = (email, database) => {
  for (let userId in database) {
    if (database[userId].email === email) {
      return database[userId];
    }
  }
  return null;
};


module.exports = {
  generateRandomString,
  getUserById,
  getUserByEmail,
};
