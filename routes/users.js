var express = require('express');
var router = express.Router();

/* GET User page. */

function convertDate(inputFormat) {
  function pad(s) { return (s < 10) ? '0' + s : s; }
  var asiaTime = new Date(inputFormat).toLocaleString("en-US", {timeZone: "Asia/Tokyo"});
  var d = new Date(asiaTime);
  return d.getFullYear()+"/"+pad(d.getMonth()+1)+"/"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds());
}

router.get('/', function(req, res, next) {
  if ( req.session.user ) {
    req.getConnection(function(err,connection){
  		var query = connection.query('SELECT * FROM user',function(err,rows)
  		{
  			if(err)
  				var errornya  = ("Error Selecting : %s ",err );
  			req.flash('msg_error', errornya);

        var rets = [];
        rows.forEach(function(result) {
              rets.push({id: result.id, IMEI: result.IMEI, block: result.block, createDate: convertDate(result.created_at)});
        });

  			res.render('user/list', {title:"Users", data:rets});
  		});
    });
	}else {
		res.render('login/login');
	}
});

module.exports = router;
