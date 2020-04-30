const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const {Thread} = require("../models/Thread");

let BoardSchema = new Schema({
  board: String,
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread"
    }
  ]
});

module.exports = mongoose.model("Board", BoardSchema);
