# Building a Telegram Bot on Hasura

This readme is about getting a Bitcoin Rate Tracking Telegram Bot to run with Hasura as quick as possible. This bot is also integrated with API from https://coindesk.com. Each command will have a description telling you what it does and also be sometimes accompanied by screenshots so that you know you are heading in the right direction.

There will also be links to provide you with more information on a topic. Do remember to follow them.

We will be using telebot package (https://github.com/mullwar/telebot) with NodeJS on our server. When a user sends a message to our bot it will be sent to our server by Telegram. We will then send a response back to the user from our server.

## Github Repo Link
* https://github.com/rishavanand/hasura-telegram-bitcoin-tracking-bot

## Pre-requisites

* [NodeJS](https://nodejs.org)

* [hasura CLI](https://docs.hasura.io/0.15/manual/install-hasura-cli.html)

### Let's start

## 1) Checkout API available on CoinDesk.com

* Visit - https://api.coindesk.com/v1/bpi/currentprice.json
* You do not need to do anything there. Just a quick view is needed just to know from where the data is coming.

![CoinBase API](https://github.com/rishavanand/hasura-telegram-bitcoin-tracking-bot/raw/master/assets/coinbase.png "CoinBase API")

## 2) Create new bot on Telegram app

* Open your Telegram app and search for BotFather
* Select /start
* Select /newbot
* Send a bot name of your choice
* Then send a bot username. Can be anything
* You will then get a confirmation message with the Bot's API. Copy the ***API KEY*** 

![Bot create](https://github.com/rishavanand/hasura-telegram-bitcoin-tracking-bot/raw/master/assets/bot_create.jpeg "Bot create")

## 3) Getting the Hasura project

```sh

# Clone the repository on your computer
$ hasura quickstart rishavanand/telegram-bitcoin-tracking-bot

# Enter the directory
$ cd telegram-bitcoin-tracking-bot

# Add telegram's api key to environment variables a.k.a hasura secrets
$ hasura secrets update bot.telegram_bot_api.key <YOUR-TELEGRAM-API-KEY>

# Commit changes
$ git add . && git commit -m "Deployment commit"

# Push to Hasura server
$ git push hasura master

```

Our Telegram Bot is now ready for use.

## 4) Creating database table

```sh
# Open Hasura API Console
$ hasura api-console

```

* Head to DATA Tab and create table called ***user_table***
* Create column ***user_id*** of type ***Integer***
* Create column ***bitcoin_limit*** of type ***Numeric***

![Create table](https://github.com/rishavanand/hasura-telegram-bitcoin-tracking-bot/raw/master/assets/create_table.png "Create table")

## 5) Interacting with your bot

Now that our bot is ready. We need to find our bot.

* Open telegram
* Search for your bot by its username
* Press /start

* ***/start***
Starts the bot

* ***/updatelimit [value]***
Example: /updatelimit 17000.
Sets the Bitcoin limit to 17000. You will be notified when the rate falls below it.

* ***/limit***
Sends your current set limit

* ***/rate***
Sends current Bitcoin Rate

* ***/help***
Sends list of available commands

![Bot interaction](https://github.com/rishavanand/hasura-telegram-bitcoin-tracking-bot/raw/master/assets/bot_interaction.gif "Bot interaction")

