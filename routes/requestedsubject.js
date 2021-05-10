var express = require('express');
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
  		var query = connection.query('SELECT * FROM requestedsubject',function(err,rows)
  		{
  			if(err)
  				var errornya  = ("Error Selecting : %s ",err );
  			req.flash('msg_error', errornya);

  			var rets = [];
        rows.forEach(function(result) {
              rets.push({id: result.id, subject: result.subject, requestedBy: result.requestedBy, createDate: convertDate(result.created_at)});
        });

  			res.render('requestedsubject/list',{title:"Requested By",data:rets});
  		});
    });
	}else {
		res.render('login/login');
	}
});

router.delete('/delete/(:id)', function(req, res, next) {
	req.getConnection(function(err,connection){
		var requestedsubject = {
			id: req.params.id,
		}

		var delete_sql = 'delete from requestedsubject where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, requestedsubject, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail);
					res.redirect('/requestedsubject');
				}
				else{
					req.flash('msg_info', 'Delete Success');
					res.redirect('/requestedsubject');
				}
			});
		});
	});
});

module.exports = router;
