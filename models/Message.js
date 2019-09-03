const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  },
  message: String,
  hash: String,
  createdAt: {
    type: String,
    required: true,
    default: new Date()
  },
  deleted: Boolean
});
module.exports = mongoose.model("Message", MessageSchema);
