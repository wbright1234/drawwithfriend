var express = require('express');
const fs = require('fs');
var path = require('path');
var router = express.Router();
/* GET block request page. */

function convertDate(inputFormat) {
  function pad(s) { return (s < 10) ? '0' + s : s; }
  var asiaTime = new Date(inputFormat).toLocaleString("en-US", {timeZone: "Asia/Tokyo"});
  var d = new Date(asiaTime);
  return d.getFullYear()+"/"+pad(d.getMonth()+1)+"/"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds());
}

router.get('/', function(req, res, next) {
  if ( req.session.user ) {
    req.getConnection(function(err,connection){
  		var query = connection.query('SELECT blockrequest.id, blockrequest.blockIMEI, blockrequest.blockBy, blockrequest.created_at, blockrequest.drawpart, user.block FROM blockrequest INNER JOIN user on blockrequest.blockIMEI = user.IMEI ORDER BY blockrequest.id',function(err,rows)
  		{
  			if(err)
  				var errornya  = ("Error Selecting : %s ",err );
  			req.flash('msg_error', errornya);

  			var rets = [];
        rows.forEach(function(result) {
          var blockstr = 'block';
          if ( result.block == 0 ){
            blockstr = 'unblock';
          }
          const imgurl = "/images/reports/" + result.id + ".png";
          rets.push({id: result.id, blockIMEI: result.blockIMEI, blockBy: result.blockBy, createDate: convertDate(result.created_at), block: blockstr, imgurl: imgurl, drawpart: result.drawpart});
        });

  			res.render('blockrequest/list',{title:"Block Report",data:rets});
  		});
    });
	}else {
		res.render('login/login');
	}
});

router.post('/block/(:id)', function(req, res, next) {
	req.getConnection(function(err,connection){
    var whereclause = {
			IMEI: req.params.id
		}
    var update_sql = 'update user SET block=1, blockdate=NOW() where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, whereclause, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail);
					res.redirect('/blockrequest');
				}
				else{
					req.flash('msg_info', 'Block Success');
					res.redirect('/blockrequest');
				}
			});
		});
	});
});

router.post('/unblock/(:id)', function(req, res, next) {
	req.getConnection(function(err,connection){
    var whereclause = {
			IMEI: req.params.id,
		}
    var update_sql = 'update user SET block=0 where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, whereclause, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail);
          console.log(errors_detail);
					res.redirect('/blockrequest');
				}
				else{
					req.flash('msg_info', 'Unblock Success');
					res.redirect('/blockrequest');
				}
			});
		});
	});
});

router.delete('/delete/(:id)', function(req, res, next) {
	req.getConnection(function(err,connection){
		var bugreport = {
			id: req.params.id,
		}

		var delete_sql = 'delete from blockrequest where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, bugreport, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail);
					res.redirect('/blockrequest');
				}
				else{
          const imgurl = path.resolve(__dirname  + "/../public/images/reports/" + req.params.id + ".png");
          fs.unlink(imgurl,function(err){
                if(err) return console.log(err);
                console.log('file deleted successfully');
          });

					req.flash('msg_info', 'Delete Success');
					res.redirect('/blockrequest');
				}
			});
		});
	});
});

router.get('/view/(:id)', function(req, res, next) {
    const imgurl = "/images/reports/" + req.params.id + ".png";
    res.render('blockrequest/view',{imgurl:imgurl});
});

module.exports = router;
