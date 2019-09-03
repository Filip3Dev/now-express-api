const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Precisamos do seu email!"],
    trim: true,
    index: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, "Onde está seu nome?"]
  },
  user_image: String,
  createdAt: {
    type: String,
    required: true,
    default: new Date()
  },
  password: {
    type: String,
    required: true
  }
});
module.exports = mongoose.model("Users", UserSchema);
