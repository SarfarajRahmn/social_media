const { response } = require('express');
const express = require('express');
const app = express();
const hbs = require('hbs');
const mysql = require('mysql');

const fileupload = require('express-fileupload');
const path = require('path');
const session = require('express-session');
const { status } = require('express/lib/response');

const db = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'mgram'
});

const publicDir = path.join(__dirname);
app.use(express.static(publicDir+'/views/public'));
app.use(session({secret:'abcxyz'}));
app.set('view engine', 'hbs');
app.use(fileupload());

// var dir = path.join(__dirname)+'/views/partial';
hbs.registerPartials(publicDir+'/views/partial');
app.use(express.urlencoded({extended:false}));

app.get('/',(req,res)=>{
    
    if(!req.session.uname){
        res.redirect("/login");
    }else{
        db.query('SELECT *from users',(err,result)=>{
        
         db.query('SELECT *FROM status ORDER BY id DESC',(err,post)=>{
             res.render('home',{
                 'users' : result,
                 'status' : post  
             })
         })
        });
    }

    
})  


app.get('/login',(req,res)=>{

    
    res.render('login');
})

app.get('/register',(req,res)=>{
    res.render('register');
})
    
app.post('/editform',(req,res)=>{  
    const {uname,pass} = req.body;
    var id = req.session.uname;

    db.query('UPDATE users SET name = ?, password = ? WHERE id = ?',[uname,pass,id],(err,result)=>{ 
        console.log(err);
     });
    
})

app.get('/editprofile',(req,res)=>{
    db.query('SELECT *FROM users WHERE id = ?',req.session.uname,(err,result)=>{
        res.render('editprofile',{
            'uname' : result[0].name,
            'pass' : result[0].password
        });
    })
   
})

app.post('/submitpost',(req,res)=>{     
    var uid = req.session.uname;
    const {upost} = req.body;

    db.query('SELECT *FROM users WHERE id = ?',uid,(err,result)=>{
        var uname = result[0].name;

        db.query('INSERT INTO status SET ?',{uid:uid,uname:uname,post:upost},(err,result)=>{})
        if(!err){
            res.redirect('/');

        } else{
            console.log(err);
        }
    })
})

app.get('/profile/:id',(req,res)=>{
    var uid = (req.params.id);
    db.query('SELECT *FROM users WHERE id = ?',uid,(err,result)=>{
       res.render('profile',{
           'users':result
       });
 
    })
})

app.post('/submitlogin',(req,res)=>{
    const {email,pass} = req.body;
    
    db.query('SELECT *FROM users WHERE email = ?',email,(err,result)=>{
        
        if(result.length == 0){
            console.log('failed')
            res.render('login',{
                'message':'sorry email already exist'
            });
        } else {
            
            if(result[0].password == pass){
                req.session.uname=result[0].id;
                res.redirect("/");
            }else{
                res.render('login',{
                    'message':'sorry password is incorrect'
                });
            }
        }  
    })
})


app.post('/submitform',(req,res)=>{
   const {uname,email,pass}= req.body;

   const d = Date.now();
   const photo = req.files.picture;
   const photoname = d+photo.name;

   db.query('INSERT INTO users SET ?',{name:uname, email:email, photo:photoname, password:pass},(err,result)=>{
       if(err == null){
           photo.mv(publicDir+'/views/public/'+photoname,(err)=>{
            res.redirect('/');    
           })
           
       } else {
           res.render('register',{
               'message':'Something went wrong'
           })
       }      
   });

})

app.listen('5000',(req,res)=>{  
        console.log('Server running on port 5000');
})