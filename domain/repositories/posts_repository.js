var path = require('path');
var root_dir = process.cwd();
var Posts = require(path.join(root_dir, 'domain/models/posts'));
var { Users } = require(path.join(root_dir, 'domain/models/users'));
const redis = require('redis');
const client_redis = redis.createClient();

var repo = module.exports = {

  get_all: function(req, res) {
    return new Promise(function(resolve, reject) {
      Posts.find(function (err, data) {
        var posts = data;
        var data_post = [];

        if (err) {
          reject(err);
        } else {
          // Get the author of post to append in posts data
          Users.find({}, '_id username', function (err, d_user) {
            posts.map(function(p, i){ // Looping posts data
              p = p.toObject(); // Convert p from string to Object
              var usr_index = d_user.findIndex(u => String(u._id) == String(p.id_user)); // Find index of 'users' Collections  depending by id_user that wrote to 'posts' Collections
              p.user = d_user[usr_index]; // push data user gotten to 'p' variable
              data_post[i] = p; // push all variable 'p' saved to 'data_post'
            });
            if (err) {
              reject(err);
            } else {
              // Show to client
              resolve(data_post);
            }
          });

        }
      }).sort({'created_at': -1});
    });
  },

  get_all_year: function(){
    // Get the month and year of grouped posts
    return new Promise(function(resolve, reject){
      Posts.aggregate(
        [{
          $group: {
            _id: {
              year: { $year: "$created_at" },
              month: { $month : "$created_at" }
            },
            count: { $sum: 1 }
          }
        }]
      ).exec(function(err, data){
        if(err){
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  get_by_month: function(yr, mon){
    // Get item of posts by filter month and year
    return new Promise(function(resolve, reject){
      Posts.aggregate(
        [
        { $project: {
            id_post: 1,
            title: 1,
            month: { $month: "$created_at" },
            year: { $year: "$created_at" }
          } },
        { $match: {
            month: parseInt(mon),
            year: parseInt(yr)
          } },
        { $sort: {"id_post": -1} }
        ]
      ).exec(function(err, data){
        if(err){
          console.log(err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  get_one: function(id) {
    return new Promise(function(resolve, reject) {
      Posts.findOne({ "id_post":id }, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if(data){
            Users.findById(data.id_user, '_id username', function (err, d_user) {
              var data_post = data.toObject(); // Convert 'data' from string to Object
              data_post.user = d_user;
              if (err) {
                reject(err);
              } else {
                resolve(data_post);
              }
            });
          } else {
            resolve(null);
          }
        }
      });
    });
  },

  get_latest: function(latest = 5) {
    return new Promise(function(resolve, reject) {
      Posts.find().sort({'created_at': -1}).limit(latest).exec(function(err, data) {
        var posts = data;
        var data_post = [];

        if (err) {
          reject(err);
        } else {
          Users.find({}, '_id username', function (err, d_user) {
            posts.map(function(p, i){ // Looping posts data
              p = p.toObject(); // Convert p from string to Object
              var usr_index = d_user.findIndex(u => String(u._id) == String(p.id_user)); // Find index of 'users' Collections  depending by id_user that wrote to 'posts' Collections
              p.user = d_user[usr_index]; // push data user gotten to 'p' variable
              data_post[i] = p; // push all variable 'p' saved to 'data_post'
            });
            if (err) {
              reject(err);
            } else {
              resolve(data_post);
            }
          });
        }
      });
    });
  },

  create: function(req, res) {
    var data = new Posts({
      title: req.body.title,
      body: req.body.body,
      id_user: res.locals.id_user, // get from middleware 'verify_token'
      created_at: new Date,
      updated_at: new Date,
      published: true,
      deleted: false
    });

    return new Promise(function(resolve, reject) {
      data.save(function (err) {
        if (err) {
          reject(err);
        } else {
          client_redis.set('updated:redis', 1);
          resolve(data);
        }
      });
    });
  },

  update: function(req, res, id) {
    return new Promise(function(resolve, reject) {
      var datas = {
        title: req.body.title,
        body: req.body.body,
        id_user: res.locals.id_user, // get from middleware 'verify_token'
        updated_at: new Date,
        published: true,
        deleted: false
      };
      Posts.findByIdAndUpdate(id, datas, {}, function(err, data){
        if (err) {
          reject(err);
        } else {
          client_redis.set('updated:redis', 1);
          resolve(datas);
        }
      });
    });
  },

  delete: function(id) {
    var data = Posts.findById(id);
    return new Promise(function(resolve, reject) {
      data.remove(function (err) {
        if (err) {
          reject(err);
        } else {
          client_redis.set('updated:redis', 1);
          resolve(data);
        }
      });
    });
  }

}
