/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  
  var testText = "Yay";
  var testId;
  var testId2;
  var testId3;

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Create new threads", function(done) {
        chai
          .request(server)
          .post("/api/threads/cdf")
          .send({ text: testText, delete_password: "pass" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/cdf")
          .send({ text: testText, delete_password: "pass" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("recent 5 Threads", function(done) {
        chai
          .request(server)
          .get("/api/threads/cdf")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isBelow(res.body.length, 6);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "replies");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password");
            testId = res.body[0]._id;
            testId2 = res.body[1]._id;
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Delete Thread", function(done) {
        chai
          .request(server)
          .delete("/api/threads/cdf")
          .send({ thread_id: testId, delete_password: "pass" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report Thread", function(done) {
        chai
          .request(server)
          .put("/api/threads/cdf")
          .send({ report_id: testId2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("Reply to Thread", function(done) {
        chai
          .request(server)
          .post("/api/replies/cdf")
          .send({
            thread_id: testId2,
            text: "My reply" + testText,
            delete_password: "pass"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("All replies", function(done) {
        chai
          .request(server)
          .get("/api/replies/cdf")
          .query({ thread_id: testId2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id");
            assert.property(res.body, "created_on");
            assert.property(res.body, "bumped_on");
            assert.property(res.body, "text");
            assert.property(res.body, "replies");
            assert.notProperty(res.body, "delete_password");
            assert.notProperty(res.body, "reported");
            assert.isArray(res.body.replies);
            assert.notProperty(res.body.replies[0], "delete_password");
            assert.notProperty(res.body.replies[0], "reported");
            assert.equal(
              res.body.replies[res.body.replies.length - 1].text,
              "a reply" + testText
            );
            done();
          });
      });
    });

    suite("PUT", function() {
      test("Report reply", function(done) {
        chai
          .request(server)
          .put("/api/threads/cdf")
          .send({ thread_id: testId2, reply_id: testId2 })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("Delete reply", function(done) {
        chai
          .request(server)
          .delete("/api/threads/cdf")
          .send({
            thread_id: testId2,
            reply_id: testId3,
            delete_password: "wrong"
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });
    });
  });
});
