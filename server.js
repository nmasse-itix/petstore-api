// Dependencies
var express = require("express");
var _ = require("underscore");
var bodyParser = require('body-parser');
var util = require('util');

// ExpressJS Setup
var app = express();
var router = express.Router();
var port = 8080;

var pets = { "1": {"id":1,"name":"Eclair","tag":"cat"}, 
             "2": {"id":2,"name":"Cannelle","tag":"cat"} };
var counter = 3;

// Log every request
router.use(function (req,res,next) {
  next();
  console.log("%s %s => %d", req.method, req.originalUrl, res.statusCode);
});

// Get all the pets
router.get("/pets/",function(req,res){
  success(res, 200, _.values(pets));
});

// Get a pet
router.get("/pets/:id",function(req,res){
  var id = req.params.id;
  if (! (id in pets)) {
    return error(res, 404, util.format("No such pet with id '%s' !", id));
  }

  success(res, 200, pets[id]);
});

// Create a pet
router.post("/pets/",function(req,res){
  var pet = req.body;
  if (pet == null) {
    return error(res, 400, "No body sent !");
  }

  pet.id = counter++;
  pets[pet.id] = pet;
  success(res, 201, pet);
});

// Delete a pet
router.delete("/pets/:id",function(req,res){
  var id = req.params.id;
  if (! (id in pets)) {
    return error(res, 404, util.format("No such pet with id '%s' !", id));
  }

  var pet = pets[id];
  delete pets[id];
  success(res, 200, pet);
});

// Update a pet
router.put("/pets/:id",function(req,res){
  var pet = req.body;
  if (pet == null) {
    return error(res, 400, "No body sent !");
  }

  var id = req.params.id;
  if (! (id in pets)) {
    return error(res, 404, util.format("No such pet with id '%s' !", id));
  }

  if (pet.id != id) {
    return error(res, 400, util.format("The id cannot be updated: '%s' vs '%s'", pet.id, id));
  }

  pets[id] = pet;
  success(res, 200, pet);
});


//
// Please find below the plumbing code
//

// Register the JSON Parser for POST and PUT requests
app.use(bodyParser.json());

// Register the router
app.use("/",router);

// 404 Handler (Not Found)
app.use("*",function(req,res){
  error(res, 404, "Not found");
});

// Start the HTTP Server
var server = app.listen(port,function(){
  console.log("API Mockup listening at port %d", port);
});

function error(res, code, message) {
  var response = {
    status: code,
    message: message
  };
  return res.status(code)
            .type("application/json")
            .send(JSON.stringify(response));
}

function success(res, code, response) {
  return res.status(code)
            .type("application/json")
            .send(JSON.stringify(response));
}
