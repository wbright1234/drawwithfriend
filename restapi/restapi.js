const pool = require('../db_connection/connection.js').pool;
var assert = require('assert');
const fs = require('fs');
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

var hintCoins = 10;

exports.checkUserStatus = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
  var sql = 'SELECT id, IMEI, block, created_at, IAP, coin, blockdate FROM user WHERE IMEI=?';
  pool.query(sql, [imei], (err, results, fields) => {
    if (err) throw err;
    if ( results.length > 0 ) {
      if ( results[0].block == 0 ) {
        var IAP = false;
        if ( results[0].IAP == 0 ) {
          IAP = false;
        } else if ( results[0].IAP == 1 ) {
          IAP = true;
        }
        //sendEmail(req, imei);
        return res.json({status: "success", IAP: IAP, coin: results[0].coin });
      } else {
        const currenttime = new Date();
        const date = new Date(results[0].blockdate);
        const diffTime = Math.abs(currenttime.getTime() - date.getTime());
        if ( diffTime > 24 * 60 * 60 * 1000 ) {
            var IAP = false;
            if ( results[0].IAP == 0 ) {
              IAP = false;
            } else if ( results[0].IAP == 1 ) {
              IAP = true;
            }
            var coin = results[0].coin;
            var sql = `UPDATE user SET block=0 WHERE id=?`;
            pool.query(sql, results[0].id, (err, results, fields) => {
              if (err) throw err;
              return res.json({status: "success", IAP: IAP, coin: coin });
            });
        } else {
            return res.json({status: "fail", message: "You are restricted from using the app. Please try again 1 day later."});
        }
      }
    } else {
      sql = `INSERT INTO user (IMEI, created_at) VALUES (?, NOW())`;
      pool.query(sql, [imei], (err, results, fields) => {
        if (err) throw err;
        return res.json({status: "success", coin: 10});
      })
    }
  });
}

getRandomSubject = () => {
  return new Promise((resolve) => {
    var sql = `SELECT * FROM subject ORDER BY RAND() LIMIT 1`;
    pool.query(sql, (err, results, fields) => {
      if (err) throw err;
      resolve(results[0]);
    });
  });
};

clearMatchRequest = (imei) => {
  return new Promise((resolve) => {
    var sql = `DELETE FROM searchrequest WHERE IMEI=?`;
    pool.query(sql, imei, (err, results, fields) => {
      if (err) throw err;
      resolve(true);
    });
  });
};

clearCodeMatchRequest = (imei) => {
  return new Promise((resolve) => {
    var sql = `DELETE FROM codesearchrequest WHERE IMEI=?`;
    pool.query(sql, imei, (err, results, fields) => {
      if (err) throw err;
      resolve(true);
    });
  });
};

connectRequest = (imei) => {
  return new Promise((resolve) => {
      var sql = 'SELECT IMEI, created_at FROM searchrequest WHERE IMEI<>?';
      pool.query(sql, [imei], (err, results, fields) => {
        if (err) throw err;
        if ( results.length > 0 ) {
            var found = false;
            for ( var i=0; i<results.length; i++ ) {
              const currenttime = new Date();
              const date = new Date(results[i].created_at);
              const diffTime = Math.abs(currenttime.getTime() - date.getTime());
              clearMatchRequest(results[i].IMEI);
              if ( diffTime < 15000 ) {
                  found = true;
                  resolve({type: true, friendimei: results[i].IMEI});
                  break;
              }
            }
            if ( found == false ) {
              clearMatchRequest(imei);
              sql = `INSERT INTO searchrequest (IMEI, created_at) VALUES (?, NOW())`;
              pool.query(sql, [imei], (err, results, fields) => {
                if (err) throw err;
                resolve({type: false});
              });
            }
        } else {
          clearMatchRequest(imei);
          sql = `INSERT INTO searchrequest (IMEI, created_at) VALUES (?, NOW())`;
          pool.query(sql, [imei], (err, results, fields) => {
            if (err) throw err;
            resolve({type: false});
          });
        }
      });
  });
}

connectRequestWithCode = (imei, code) => {
  return new Promise((resolve) => {
      var sql = 'SELECT IMEI, created_at FROM codesearchrequest WHERE IMEI<>? AND CODE = ?';
      pool.query(sql, [imei, code], (err, results, fields) => {
        if (err) throw err;
        if ( results.length > 0 ) {
            var found = false;
            for ( var i=0; i<results.length; i++ ) {
              const currenttime = new Date();
              const date = new Date(results[i].created_at);
              const diffTime = Math.abs(currenttime.getTime() - date.getTime());
              clearCodeMatchRequest(results[i].IMEI);
              if ( diffTime < 15000 ) {
                  found = true;
                  resolve({type: true, friendimei: results[i].IMEI});
                  break;
              }
            }
            if ( found == false ) {
              clearCodeMatchRequest(imei);
              sql = `INSERT INTO codesearchrequest (IMEI, code, created_at) VALUES (?, ?, NOW())`;
              pool.query(sql, [imei, code], (err, results, fields) => {
                if (err) throw err;
                resolve({type: false});
              });
            }
        } else {
          clearCodeMatchRequest(imei);
          sql = `INSERT INTO codesearchrequest (IMEI, code, created_at) VALUES (?, ?, NOW())`;
          pool.query(sql, [imei, code], (err, results, fields) => {
            if (err) throw err;
            resolve({type: false});
          });
        }
      });
  });
}

exports.connectWithFriend = async (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
    lock.acquire('key', function(done) {
      Promise.all([connectRequest(imei)]).then(async results => {
        //done('err', results[0]);
        if ( results[0].type == true ) {
          var friendimei = results[0].friendimei;
          var position = "";
          var headIMEI = imei;
          var bodyIMEI = imei;
          var rand = Math.random();
          if ( rand >= 0.5 ) {
              position = "FACE";
              headIMEI = imei;
              bodyIMEI = friendimei;
          } else {
              position = "BODY";
              headIMEI = friendimei;
              bodyIMEI = imei;
          }

          Promise.all([getRandomSubject()]).then(async results => {
              var subjectTitle = results[0].title;
              var subjectID = results[0].id;
              var subjectSearchUrl = results[0].searchurl;

              sql = `INSERT INTO drawmatch (subjectid, headIMEI, bodyIMEI, created_at) VALUES (?, ?, ?, NOW())`;
              pool.query(sql, [subjectID, headIMEI, bodyIMEI], (err, results, fields) => {
                if (err) throw err;

                var position1 = "";
                if ( position == "FACE") {
                  position1 = "BODY";
                } else if ( position == "BODY" ) {
                  position1 = "FACE";
                }
                var sendparam = {
                    type : 'drawMatched',
                    imei : imei,
                    drawmatchid : results.insertId,
                    subjecttitle: subjectTitle,
                    drawposition: position1,
                    searchurl: subjectSearchUrl,
                    code: ''
                };
                sendOppositeMsg(friendimei, sendparam);
                setWSIDs(imei, friendimei, results.insertId);
                setWSIDs(friendimei, imei, results.insertId);
                done();
                return res.json({status: "matched", imei: imei, matchedimei: friendimei, drawmatchid: results.insertId, subjecttitle: subjectTitle, drawposition: position, searchurl: subjectSearchUrl });
              })
          });
        } else {
            done();
            return res.json({imei: imei, status: "searching"});
        }
      });
    }, function(err, ret) {
    }, {});
}

exports.connectWithCode = async (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
  var code = req.body.code;
  if (!code) {
    return res.json({status: "fail", message: "Code field is required"});
  }
    lock.acquire('key', function(done) {
      Promise.all([connectRequestWithCode(imei, code)]).then(async results => {
        //done('err', results[0]);
        if ( results[0].type == true ) {
          var friendimei = results[0].friendimei;
          var position = "";
          var headIMEI = imei;
          var bodyIMEI = imei;
          var rand = Math.random();
          if ( rand >= 0.5 ) {
              position = "FACE";
              headIMEI = imei;
              bodyIMEI = friendimei;
          } else {
              position = "BODY";
              headIMEI = friendimei;
              bodyIMEI = imei;
          }

          Promise.all([getRandomSubject()]).then(async results => {
              var subjectTitle = results[0].title;
              var subjectID = results[0].id;
              var subjectSearchUrl = results[0].searchurl;

              sql = `INSERT INTO drawmatch (subjectid, headIMEI, bodyIMEI, created_at) VALUES (?, ?, ?, NOW())`;
              pool.query(sql, [subjectID, headIMEI, bodyIMEI], (err, results, fields) => {
                if (err) throw err;

                var position1 = "";
                if ( position == "FACE") {
                  position1 = "BODY";
                } else if ( position == "BODY" ) {
                  position1 = "FACE";
                }
                var sendparam = {
                    type : 'drawMatched',
                    imei : imei,
                    drawmatchid : results.insertId,
                    subjecttitle: subjectTitle,
                    drawposition: position1,
                    searchurl: subjectSearchUrl,
                    code: code
                };
                sendOppositeMsg(friendimei, sendparam);
                setWSIDs(imei, friendimei, results.insertId);
                setWSIDs(friendimei, imei, results.insertId);
                done();
                return res.json({status: "matched", imei: imei, matchedimei: friendimei, drawmatchid: results.insertId, subjecttitle: subjectTitle, drawposition: position, searchurl: subjectSearchUrl });
              })
          });
        } else {
            done();
            return res.json({imei: imei, status: "searching"});
        }
      });
    }, function(err, ret) {
    }, {});
}

exports.cancelMatch = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
  var sql = 'SELECT IMEI FROM searchrequest WHERE IMEI=?';
  pool.query(sql, [imei], (err, results, fields) => {
    if (err) throw err;
    if ( results.length > 0 ) {
      clearMatchRequest(imei);
      return res.json({status: "success"});
    } else {
      return res.json({status: "fail", message: "No searching"});
    }
  });
}

getDrawMatch = (id) => {
  return new Promise((resolve) => {
    var sql = `SELECT headIMEI, bodyIMEI FROM drawmatch WHERE id=?`;
    pool.query(sql, id, (err, results, fields) => {
      if (err) throw err;
      resolve(results[0]);
    });
  });
};

exports.reportUser = (req, res) => {
  	var blockimei = req.body.blockimei;
    if (!blockimei) {
      return res.json({status: "fail", message: "blockimei field is required"});
    }
    var blockbyimei = req.body.blockbyimei;
    if (!blockbyimei) {
      return res.json({status: "fail", message: "blockbyimei field is required"});
    }
    var drawmatchid = req.body.drawmatchid;
    if (!drawmatchid) {
      return res.json({status: "fail", message: "drawmatchid field is required"});
    }
    var image = req.body.image;
    if (!image) {
      return res.json({status: "fail", message: "image field is required"});
    }
    var part = req.body.part;
    if (!part) {
      return res.json({status: "fail", message: "part field is required"});
    }
    sql = `INSERT INTO blockrequest (matchId, blockIMEI, drawpart, blockBy, created_at) VALUES (?, ?, ?, ?, NOW())`;
	  pool.query(sql, [drawmatchid, blockimei, part, blockbyimei], (err, results, fields) => {
	    if (err) throw err;

	    var base64Data = image.replace(/^data:image\/png;base64,/, "");
	    const fullUrl = __dirname  + "/../public/images/reports/" + results.insertId+".png";
	    fs.writeFile(fullUrl, base64Data, 'base64', function(err) {
	      console.log('writefile', err);
	    });

      return res.json({status: "success", message: "Report user successfully."});
    });
}

exports.requestSubject = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
  var title = req.body.title;
  if (!title) {
    return res.json({status: "fail", message: "TITLE field is required"});
  }
  sql = `INSERT INTO requestedsubject (subject, requestedBy, created_at) VALUES (?, ?, NOW())`;
  pool.query(sql, [title, imei], (err, results, fields) => {
    if (err) throw err;
    return res.json({status: "success", message: "Subject submitted successfully."});
  })
}

exports.bugReport = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "IMEI field is required"});
  }
  var report = req.body.report;
  if (!report) {
    return res.json({status: "fail", message: "Report field is required"});
  }
  sql = `INSERT INTO bugreport (IMEI, report, created_at) VALUES (?, ?, NOW())`;
  pool.query(sql, [imei, report], (err, results, fields) => {
    if (err) throw err;
    return res.json({status: "success", message: "Bug reported successfully."});
  })
}

updateDrawMatchFinish = (position, drawmatchid) => {
  return new Promise((resolve) => {
    var sql = `UPDATE drawmatch SET headFinish=1 WHERE id=?`;
    if ( position == "BODY"){
      sql = `UPDATE drawmatch SET bodyFinish=1 WHERE id=?`;
    }
    pool.query(sql, [drawmatchid], (err, results, fields) => {
      if (err) throw err;
      resolve(true);
    })
  });
}

checkFriendFinishDraw = (position, drawmatchid) => {
  return new Promise((resolve) => {
    var sql = 'SELECT headFinish FROM drawmatch WHERE id=?';
    if ( position == "FACE"){
      var sql = 'SELECT bodyFinish FROM drawmatch WHERE id=?';
    } else if ( position == "BODY") {
      var sql = 'SELECT headFinish FROM drawmatch WHERE id=?';
    }
    pool.query(sql, [drawmatchid], (err, results, fields) => {
      if (err) throw err;
      if ( position == "FACE"){
        resolve(results[0].bodyFinish);
      } else {
        resolve(results[0].headFinish);
      }
    })
  });
}

exports.drawFinished = (req, res) => {
  var drawmatchid = req.body.drawmatchid;
  if (!drawmatchid) {
    return res.json({status: "fail", message: "drawmatchid field is required"});
  }
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "imei field is required"});
  }
  var matchedimei = req.body.matchedimei;
  if (!matchedimei) {
    return res.json({status: "fail", message: "matchedimei field is required"});
  }
  var position = req.body.position;
  if (!position) {
    return res.json({status: "fail", message: "position field is required"});
  }
  if ( position != "FACE" && position != "BODY" ) {
    return res.json({status: "fail", message: "position field is wrong value"});
  }
  var image = req.body.image;
  if (!image) {
    return res.json({status: "fail", message: "image field is required"});
  }
  Promise.all([updateDrawMatchFinish(position, drawmatchid), checkFriendFinishDraw(position, drawmatchid)]).then(async results => {
    if ( results[1] == 0 ) {
      fs.writeFile("/tmp/"+drawmatchid+".txt", image, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file was saved!");
      });
      return res.json({status: "drawing"});
    } else if ( results[1] == 1 ) {
      var sendparam = {
          type : 'drawFinished',
          matchedimei : imei,
          drawmatchid : drawmatchid,
          oppositeimage : image
      };
      sendOppositeMsg(matchedimei, sendparam);

      fs.readFile("/tmp/"+drawmatchid+".txt", { encoding: 'utf8' }, function(err,data){
          if (!err) {
          	  fs.unlink("/tmp/"+drawmatchid+".txt",function(err){
                    if(err) return console.log(err);
                    console.log('file deleted successfully');
              });

              return res.json({status: "finished", oppositeimage: data, drawmatchid: drawmatchid, matchedimei: matchedimei});
          } else {
              console.log(err);
              return res.json({status: "fail", message: "Can't get friend's image"});
          }
      });
    } else {
      return res.json({status: results});
    }
  });
}

exports.IAPSuccess = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "imei field is required"});
  }
  var sql = `UPDATE user SET IAP=1 WHERE IMEI=?`;
  pool.query(sql, [imei], (err, results, fields) => {
    if (err) throw err;
    return res.json({status: "success", message: "Purchased successfully."});
  })
}

getUserCoin = (imei) => {
  return new Promise((resolve) => {
    var sql = 'SELECT coin FROM user WHERE IMEI=?';
    pool.query(sql, [imei], (err, results, fields) => {
      if (err) throw err;
      resolve(results[0].coin);
    })
  });
}

exports.purchaseCoin = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "imei field is required"});
  }
  var coin = req.body.coin;
  if (!coin) {
    return res.json({status: "fail", message: "coin field is required"});
  }
  Promise.all([getUserCoin(imei)]).then(async results => {
    var newcoin = Number(results[0]) + Number(coin);
    var sql = `UPDATE user SET coin=? WHERE IMEI=?`;
    pool.query(sql, [newcoin, imei], (err, results, fields) => {
      if (err) throw err;
      return res.json({status: "success", coin: newcoin, message: "Purchased successfully."});
    });
  });
}

exports.buyHint = (req, res) => {
  var imei = req.body.imei;
  if (!imei) {
    return res.json({status: "fail", message: "imei field is required"});
  }
  Promise.all([getUserCoin(imei)]).then(async results => {
    var coin = Number(results[0]);
    if ( coin >= hintCoins ) {
      var newcoin = coin - hintCoins;
      var sql = `UPDATE user SET coin=? WHERE IMEI=?`;
      pool.query(sql, [newcoin, imei], (err, results, fields) => {
        if (err) throw err;
        return res.json({status: "success", message: "Buy hint successfully.", coin: newcoin});
      });
    } else {
      return res.json({status: "fail", message: "No enough coin."});
    }
  });
}
