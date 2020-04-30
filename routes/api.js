/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;

const mongoose = require("mongoose");
const mongo = require("mongodb");
const config = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
};

mongoose.connect(process.env.DATABASE, config);

const Board = require("../models/Board");
const Thread = require("../models/Thread");

module.exports = function(app) {
  app.route("/api/threads/:board").get(function(req, res) {
    const board = req.params.board;

    Board.findOne({ board })
      .populate({
        path: "threads",
        options: {
          sort: { bumped_on: -1 },
          limit: 10
        }
      })
      .exec((err, myThreads) => {
        if (err) {
          console.log(err);
        } else {
          res.json(
            myThreads.threads.map(thread => ({
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies:
                thread.replies.length > 3
                  ? thread.replies.slice(-3).map(val => ({
                      _id: val._id,
                      text: val.text,
                      created_on: val.created_on
                    }))
                  : thread.replies.map(val => ({
                      _id: val._id,
                      text: val.text,
                      created_on: val.created_on
                    })),
              replycount: thread.replies.length
            }))
          );
        }
      });
  });

  app.route("/api/threads/:board").post(function(req, res) {
    const board = req.params.board;
    const { text, delete_password } = req.body;

    if (!text || !delete_password) {
      return res.json({ failure: "Missing required fields" });
    }

    let data = { text, delete_password };

    Board.findOne({ board }, (err, myBoard) => {
      if (err) {
        console.log(err);
      }

      if (myBoard) {
        newThread(Thread, board, data, myBoard, res);
      } else {
        Board.create({ board }, (err, newBoard) => {
          if (err) {
            console.log(err);
          }

          newThread(Thread, board, data, newBoard, res);
        });
      }
    });
  });

  app.route("/api/threads/:board").put(function(req, res) {
    const { thread_id } = req.body;

    Thread.findByIdAndUpdate(
      { _id: thread_id },
      { reported: true },
      (err, thread) => {
        if (err) {
          console.log(err);
        }

        res.send("reported");
      }
    );
  });

  app.route("/api/threads/:board").delete(function(req, res) {
    const board = req.params.board;
    const { thread_id, delete_password } = req.body;

    Thread.findById({ _id: thread_id }, (err, myThread) => {
      if (err) {
        console.log(err);
      }

      if (myThread.delete_password === delete_password) {
        myThread.deleteOne({ thread_id }, (err, deleted) => {
          if (err) {
            console.log(err);
          }

          Board.findOneAndUpdate(
            { board },
            { $pull: { threads: thread_id } },
            { new: true },
            (err, board) => {
              if (err) {
                console.log(err);
              }

              res.send("success");
            }
          );
        });
      } else {
        res.send("incorrect password");
      }
    });
  });

  app.route("/api/replies/:board").get(function(req, res) {
    const board = req.params.board;
    const thread_id = req.query.thread_id;

    if (!thread_id) {
      res.send();
    } else {
      Board.findOne({ board })
        .populate({
          path: "threads",
          match: { _id: thread_id }
        })
        .exec((err, myThread) => {
          if (err) {
            console.log(err);
          } else {
            const thread = myThread.threads[0];

            res.json({
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: thread.replies.map(val => ({
                _id: val._id,
                text: val.text,
                created_on: val.created_on
              }))
            });
          }
        });
    }
  });

  app.route("/api/replies/:board").post(function(req, res) {
    const board = req.params.board;
    const { text, delete_password, thread_id } = req.body;

    if (!text || !delete_password || !thread_id) {
      return res.json({ failure: "Missing required fields" });
    }

    Board.findOne({ board }, (err, myBoard) => {
      if (err) {
        console.log(err);
      } else {
        Thread.findById(thread_id, (err, myThread) => {
          if (err) {
            console.log(err);
          }

          myThread.replies.push({ text, delete_password });
          myThread.bumped_on =
            myThread.replies[myThread.replies.length - 1].created_on;
          myThread.save();

          res.redirect(`/b/${board}/${thread_id}`);
        });
      }
    });
  });

  app.route("/api/replies/:board").put(function(req, res) {
    const { thread_id, reply_id } = req.body;

    Thread.findById({ _id: thread_id }, (err, myThread) => {
      if (err) {
        console.log(err);
      }

      const myReply = myThread.replies.filter(val =>
        val._id.equals(reply_id)
      )[0];

      myReply.reported = true;
      myThread.save();
      res.send("reported");
    });
  });

  app.route("/api/replies/:board").delete(function(req, res) {
    const board = req.params.board;
    const { thread_id, reply_id, delete_password } = req.body;

    Board.findOne({ board })
      .populate({
        path: "threads",
        match: { _id: thread_id }
      })
      .exec((err, myThread) => {
        if (err) {
          console.log(err);
        } else {
          const thread = myThread.threads[0];

          const myReply = thread.replies.filter(val =>
            val._id.equals(reply_id)
          )[0];

          if (myReply.delete_password === delete_password) {
            myReply.text = "[deleted]";
            thread.save();
            res.send("success");
          } else {
            res.send("incorrect password");
          }
        }
      });
  });
};

function newThread(model, board, data, callback, res) {
  model.create(data, (err, thread) => {
    if (err) {
      console.log(err);
    }

    callback.threads.push(thread);
    callback.save((err, thread) => {
      if (err) {
        console.lor(err);
      }
    });

    res.redirect("/b/" + board + "/");
  });
}
