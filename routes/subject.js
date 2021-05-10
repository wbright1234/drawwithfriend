var express = require('express');
var router = express.Router();

/* GET Subject page. */

router.get('/', function(req, res, next) {
	if ( req.session.user ) {
		req.getConnection(function(err,connection){
			var query = connection.query('SELECT * FROM subject',function(err,rows)
			{
				if(err)
					var errornya  = ("Error Selecting : %s ",err );
				req.flash('msg_error', errornya);
				res.render('subject/list',{title:"Subjects",data:rows});
			});
	  });
	}else {
		res.render('login/login');
	}
});

router.delete('/delete/(:id)', function(req, res, next) {
	req.getConnection(function(err,connection){
		var subject = {
			id: req.params.id,
		}

		var delete_sql = 'delete from subject where ?';
		req.getConnection(function(err,connection){
			var query = connection.query(delete_sql, subject, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Delete : %s ",err);
					req.flash('msg_error', errors_detail);
					res.redirect('/subject');
				}
				else{
					req.flash('msg_info', 'Delete Subject Success');
					res.redirect('/subject');
				}
			});
		});
	});
});

router.get('/edit/(:id)', function(req,res,next){
	req.getConnection(function(err,connection){
		var query = connection.query('SELECT * FROM subject where id='+req.params.id,function(err,rows)
		{
			if(err)
			{
				var errornya  = ("Error Selecting : %s ",err );
				req.flash('msg_error', errors_detail);
				res.redirect('/subject');
			}else
			{
				if(rows.length <=0)
				{
					req.flash('msg_error', "Subject can't be find!");
					res.redirect('/subject');
				}
				else
				{
					console.log(rows);
					res.render('subject/edit',{title:"Edit",data:rows[0]});
				}
			}
		});
	});
});

router.put('/edit/(:id)', function(req,res,next){
	req.assert('subjectname', 'Please fill the subjectname').notEmpty();
	var errors = req.validationErrors();
	if (!errors) {
		var subject = {
			title: req.body.subjectname,
			searchurl: req.body.searchurl,
		}

		var update_sql = 'update subject SET ? where id = '+req.params.id;
		req.getConnection(function(err,connection){
			var query = connection.query(update_sql, subject, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Update : %s ",err );
					req.flash('msg_error', errors_detail);
					res.render('subject/edit',
					{
						subjectname: req.body.subjectname,
						searchurl: req.body.searchurl,
					});
				}else{
					req.flash('msg_info', 'Update subject success');
					res.redirect('/subject/edit/'+req.params.id);
				}
			});
		});
	}else{
		console.log(errors);
		errors_detail = "<p>Sory there are error</p><ul>";
		for (i in errors)
		{
			error = errors[i];
			errors_detail += '<li>'+error.msg+'</li>';
		}
		errors_detail += "</ul>";
		req.flash('msg_error', errors_detail);
		res.render('subject/add-subject',
		{
			subjectname: req.body.subjectname,
			searchurl: req.body.searchurl
		});
	}
});

router.post('/add', function(req, res, next) {
	console.log(req.body.searchurl);
	req.assert('subjectname', 'Please fill the subjectname').notEmpty();
	var errors = req.validationErrors();
	if (!errors) {
		var subject = {
			title: req.body.subjectname,
			searchurl: req.body.searchurl
		}
		var insert_sql = 'INSERT INTO subject SET ?';
		req.getConnection(function(err,connection){
			var query = connection.query(insert_sql, subject, function(err, result){
				if(err)
				{
					var errors_detail  = ("Error Insert : %s ",err );
					req.flash('msg_error', errors_detail);
					res.render('subject/add-subject',
					{
						subjectname: req.body.subjectname,
						searchurl: req.body.searchurl,
					});
				}else{
					req.flash('msg_info', 'Create subject success');
					res.redirect('/subject');
				}
			});
		});
	}else{
		console.log(errors);
		errors_detail = "<p>Sory there are error</p><ul>";
		for (i in errors)
		{
			error = errors[i];
			errors_detail += '<li>'+error.msg+'</li>';
		}
		errors_detail += "</ul>";
		req.flash('msg_error', errors_detail);
		res.render('subject/add-subject',
		{
			subjectname: req.body.searchurl,
			searchurl: req.body.searchurl
		});
	}
});

router.get('/add', function(req, res, next) {
	res.render(	'subject/add-subject',
	{
		title: 'Add New Subject',
		subjectname: '',
		searchurl: '',
	});
});

module.exports = router;
