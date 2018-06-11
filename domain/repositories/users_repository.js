var path = require('path');
var bcrypt = require('bcrypt');
var root_dir = process.cwd();
var { Users, db } = require(path.join(root_dir, 'domain/models/users'));

var repo = module.exports = {

  generate_password: function (password) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
  },

  compare_password: function (password, password_hashed) {
    return bcrypt.compareSync(password, password_hashed);
  },

  get_all: function(req, res) {
    return new Promise(function(resolve, reject) {
      Users.find(function (err, user) {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  get_one: function(id) {
    return new Promise(function(resolve, reject) {
      Users.findById(id, function (err, user) {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  create: function(req, res) {
    var user = new Users({
      username: req.body.username,
      email: req.body.email,
      password: repo.generate_password(req.body.password),
      created_at: new Date,
      updated_at: new Date
    });

    return new Promise(function(resolve, reject) {
      user.save(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  update: function(req, res, id) {
    return new Promise(function(resolve, reject) {
      Users.findById(id, function(err, user){

        if(req.body.username) { user.set({ username : req.body.username }); }
        if(req.body.email) { user.set({ email : req.body.email }); }
        if(req.body.password) { user.set({ password : generate_password(req.body.password) }); }
        user.set({ updated_at : new Date });

        user.save(function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        });

      });
    });
  },

  delete: function(id) {
    var user = Users.findById(id);
    return new Promise(function(resolve, reject) {
      user.remove(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  },

  login: function(req, res, id) {
    return new Promise(function(resolve, reject) {
      Users.findOne({ username: req.body.username }, function(err, user){

        var logindata = {};
        if(user){
          if(repo.compare_password(req.body.password, user.password)) {
            logindata = {
              username: { "req": req.body.username,
                "res": user.username},
              password: { "req": "XXXXXX",
                "res": user.password }
            }
          }
        }

        if (err) {
          reject(err);
        } else {
          resolve(logindata);
        }
      });
    });
  }

}