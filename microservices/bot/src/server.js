var request = require('request');
var bodyParser = require('body-parser');
var express = require('express');
var TeleBot = require('telebot');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const bot = new TeleBot(process.env.TELEGRAM_BOT_API)

var url = "http://data.hasura/v1/query";

var coindesk_url = 'https://api.coindesk.com/v1/bpi/currentprice.json'

/* Web Stuff */

app.get('/', function (req, res) {	
	res.send("Your Bitcoin price tracking bot is live :D")
});

/* Bot Stuff */

bot.on(['/start'], msg => {

	// Add new user
	addUser(msg.from.id)
	return bot.sendMessage(msg.from.id, "Hi there! Let's get started. \n\n/updatelimit [value] to update limit\n/limit to check current set limit\n/rate to check current Bitcoin rate\n/help to get list of commands\n")

});

bot.on(['/limit'], msg => {

	// Return bicoin limit
	getBitcoinLimit(msg.from.id, function (bitcoinLimit) {
		if (bitcoinLimit)
			return bot.sendMessage(msg.from.id, "Your set limit is : $" + bitcoinLimit + ". You will be notified when price falls below this limit.")
		else {
			return bot.sendMessage(msg.from.id, "You haven't set a limit to track. Please use /updatelimit [value] to update your limit")
		}
	})

});

bot.on(['/help'], msg => {

	return bot.sendMessage(msg.from.id, "List of commands: \n\n/updatelimit [value] to update limit\n/limit to check current set limit\n/rate to check current Bitcoin rate\n/help to get list of commands\n")

});

bot.on(['/rate'], msg => {

	var params = {
		'reqUrl': coindesk_url,
		'reqMethod': 'GET',
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
	};

	request(reqData, function (error, response, body) {
		response = JSON.parse(response.body)
		var rate = response.bpi.USD.rate

		let replyMarkup = bot.keyboard([
			['/rate', '/limit', '/help']
		], { resize: true });

		return bot.sendMessage(msg.from.id, "Current rate : $" + rate, {replyMarkup})
	});

});

// Update limit
bot.on(/^\/updatelimit (.+)$/, (msg,props)  => {

	var limit = props.match[1]
	console.log(limit)
	if(isNaN(limit)){
		return bot.sendMessage(msg.from.id, "You have entered an invalid limit. Please enter a proper limit in the format /updatelimit [value]")
	}
	else{
		updateLimit(msg.from.id, limit, function(success){
			if (success)
				return bot.sendMessage(msg.from.id, "Your limit has been set to : " + limit + ". You will be notified when price drops below it.")
			else
				return bot.sendMessage(msg.from.id, "Your limit could not be updated. Please try again.")
		})
	}

});

// Get bitcoin limit of user
function getBitcoinLimit(userid, callback) {

	var params = {
		'reqHeaders': {
			"Content-Type": "application/json",
			"X-Hasura-Role": "admin",
			"X-Hasura-User-Id": "1"
		},
		'reqUrl': url,
		'reqMethod': 'POST',
		'reqJson': {
			"type": "select",
			"args": {
				"table": "user_table",
				"columns": ["*"],
				"where": {
					"user_id": userid
				}
			}
		}
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
		headers: params['reqHeaders'],
		json: params['reqJson']
	};

	request(reqData, function (error, response, body) {
		if (response.body.length > 0) {
			callback(response.body[0].bitcoin_limit)
		} else
			callback(false)
	});

}

// Add new user
function addUser(userid) {

	var params = {
		'reqHeaders': {
			"Content-Type": "application/json",
			"X-Hasura-Role": "admin",
			"X-Hasura-User-Id": "1"
		},
		'reqUrl': url,
		'reqMethod': 'POST',
		'reqJson': {
			"type": "insert",
			"args": {
				"table": "user_table",
				"objects": [
					{ "user_id": userid }
				]
			}
		}
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
		headers: params['reqHeaders'],
		json: params['reqJson']
	};

	request(reqData, function (error, response, body) {
		if (response.body.affected_rows == 1)
			console.log("User added")
		else
			console.log("Could not add user")
	});

}

// Update user bitcoin limit
function updateLimit(userid, bitcoinValue, callback) {

	var params = {
		'reqHeaders': {
			"Content-Type": "application/json",
			"X-Hasura-Role": "admin",
			"X-Hasura-User-Id": "1"
		},
		'reqUrl': url,
		'reqMethod': 'POST',
		'reqJson': {
			"type": "update",
			"args": {
				"table": "user_table",
				"$set": { "bitcoin_limit": bitcoinValue },
				"where": {
					"user_id": userid
				}
			}
		}
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
		headers: params['reqHeaders'],
		json: params['reqJson']
	};

	request(reqData, function (error, response, body) {
		if (response.body.affected_rows == 1)
			callback(true)
		else
			callback(false)
	});

}

/* Notification Stuff */

function keepTrack(){
	getRate(function (rate) {
		getIds(rate, function (ids) {
			sendNotification(ids, rate)
		})
	})
} 

setInterval(keepTrack, 60000);

function sendNotification(ids,rate){
	var totalIds = ids.length
	function sendTelegram(i){
		if(i < totalIds){
			bot.sendMessage(ids[i].user_id, "Bitcoin Alert!!\n\nBitcoin rate has fallen below your set limit. Its current rate is : $" + rate + "\n\nNote: Limit has also been removed. Please update your limit again to receive notifications.")
			updateLimit(ids[i].user_id, null, function(success){
				sendTelegram(i + 1)
			})
		}
	}
	sendTelegram(0)
}

function getRate(callback){
	var params = {
		'reqUrl': coindesk_url,
		'reqMethod': 'GET',
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
	};

	request(reqData, function (error, response, body) {
		response = JSON.parse(response.body)
		callback(response.bpi.USD.rate_float)
	});
}

function getIds(rate, callback){
	// Get user_ids whose limit is crossed
	var params = {
		'reqHeaders': {
			"Content-Type": "application/json",
			"X-Hasura-Role": "admin",
			"X-Hasura-User-Id": "1"
		},
		'reqUrl': url,
		'reqMethod': 'POST',
		'reqJson': {
			"type": "select",
			"args": {
				"table": "user_table",
				"columns": ["user_id"],
				"where": {
					"bitcoin_limit": { "$gte": rate }
				}
			}
		}
	}

	var reqData = {
		url: params['reqUrl'],
		method: params['reqMethod'],
		headers: params['reqHeaders'],
		json: params['reqJson']
	};

	request(reqData, function (error, response, body) {
		ids = response.body
		callback(ids)
	});
}

bot.connect();

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
