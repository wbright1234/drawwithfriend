var express = require('express');
const md5 = require('md5');
var router = express.Router();

/* GET Subject page. */

router.get('/', function(req, res, next) {
		res.render('login/login');
});

router.post('/', function(req, res, next) {
	const email = req.sanitize( 'email' ).escape().trim();
	const password = req.sanitize( 'password' ).escape().trim();
	if ( email == '' ) {
		req.flash('msg_error', 'Input email');
		res.redirect('/login');
	} else if ( password == '' ) {
		req.flash('msg_error', 'Input password');
		res.redirect('/login');
	} else {
		req.getConnection(function(err,connection){
			var whereclause = {
				email: email
			}
			var query = connection.query('SELECT email, password FROM admin WHERE ?', whereclause, function(err,rows)
			{
				if(err){
					req.flash('msg_error', 'No email');
					res.redirect('/login');
				} else {
					if ( rows.length > 0 ) {
						if ( rows[0].password == md5(password) ) {
							req.session.user = rows[0];
							res.redirect('/user');
						} else {
							req.flash('msg_error', 'Password not correct');
							res.redirect('/login');
						}
					} else {
						req.flash('msg_error', 'Email not correct');
						res.redirect('/login');
					}
				}
			});
	  });
	}
});

router.put('/editpassword', function(req, res, next) {
	if ( req.body.email == '' ) {
		req.flash('msg_error', 'Input email');
		res.redirect('/login');
	} else if ( req.body.password == '' ) {
		req.flash('msg_error', 'Input password');
		res.redirect('/login');
	} else {
		var user = {
			email: req.body.email,
			password: md5(req.body.password),
		}
		var update_sql = 'update admin SET ? where id = 1';
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, user, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );
					req.flash('msg_error', errors_detail);
					//res.redirect('/user');
				}else{
					req.flash('msg_info', 'Update success');
					res.render('login/edit');
				}
			});
		});
	}
});

router.get('/edit', function(req, res, next) {
   res.render('login/edit');
});

router.get('/logout', function(req, res, next) {
   req.session.destroy(function(){
      console.log("user logged out.")
   });
   res.redirect('/login');
});

module.exports = router;
