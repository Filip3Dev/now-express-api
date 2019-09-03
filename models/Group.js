const mongoose = require("mongoose");
const GroupSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  name: {
    type: String,
    required: [true, "Onde está o nome do grupo?"]
  },
  group_image: String,
  cod: String,
  createdAt: {
    type: String,
    required: true,
    default: new Date()
  },
  private: Boolean
});
module.exports = mongoose.model("Group", GroupSchema);
