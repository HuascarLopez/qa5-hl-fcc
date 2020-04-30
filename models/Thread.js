const mongoose = require("mongoose");
const Schema = mongoose.Schema;


let ReplySchema = new Schema({
  text: String,
  created_on: {
    type: Date,
    default: new Date().toISOString()
  },
  delete_password: String,
  reported: {
    type: Boolean,
    default: false
  }
});

let ThreadSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  created_on: {
    type: Date,
    default: new Date().toUTCString()
  },
  bumped_on: {
    type: Date,
    default: new Date().toUTCString()
  },
  reported: {
    type: Boolean,
    default: false
  },
  delete_password: {
    type: String,
    required: true
  },
  replies: [ReplySchema]
});

module.exports = mongoose.model("Thread", ThreadSchema);