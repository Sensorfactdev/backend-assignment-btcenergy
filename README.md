# Backend Engineer Technichal Assignment
## Introduction 
The goal of this assesment is to asses the technichal, analytical and collaboration skills of backend 
software developers joining Sensorfact. 

In this assignment, we included a few of the technologies that we use in our
existing products:

- **GraphQL:**
  Within Sensorfact we expose most of our data regarding measurements, machine
  specific configuration and industry knowledge via a GraphQL API.
- **Serverless:**
  A big part of our backend consists of NodeJS services in a
  Kubernetes cluster, but we are moving the logic of simple services to AWS Lambda
  functions and deploy these using Serverless.
- **TypeScript:**
  A big part of our code is written in plain JavaScript. All
  new projects use TypeScript, because we like the benefits that the type system
  offers us during development, reviews and testing.

## Process & Guidelines

>- **We aim to timebox the assignment to 4 hours**, but feel free to dedicate as much time as you consider necessary
>- Make a conscious decision on what you want to focus on: it's fine if you
   cannot complete the entire assignment.
>- Send us your solution before the technical interview in the form of a link to a repository. 
   You can for example fork this repository.
>- The assignment include a description of a problem to solve which could potentially lack of
   details. Feel free to make assumptions if needed, or if you consider necessary contact us for
   clarification.
>- Take this assignment as an opportunity to show us your style: what you like to
   work on, what you find important, how do you address problems,etc.
>- **During the technical interview, we will invite you to present your solution and discuss 
   it together as a team**: which decisions you took and why, questions about specific parts of the code,
   libraries you have used, how easy and maintainable is the code,etc.
>- 

## Problem to solve (an imaginary one, of course ;))

Sustainability is starting to take a key role in every product or solution which is launch into the market and software
systems are not an exception to it. It is not enough anymore to create and deploy in time complex and innovative 
systems which bring value to customers by solving part of their problems, they also need to be efficient. They need to 
be sustainable and consume the minimum amount of resources in their operations.

As you probably have heard one of the principal arguments against using Bitcoin is the amount of energy needed to keep
the system running. As part of evaluation about the sustainability of the blockchain network in which Bitcoin runs we
would like to create a platform to monitor the energy spend on performing financial transactions using Bitcoin.

The platform will visualize the energy consume by the network and potentially calculate energy waste. Our frontend
development team will need an API (preferably GraphQL) to connect to that provide this information. The platform should
be able to:

- Provide the energy compsution of BTC transactions between a certain start and end date.
- Provide the energy compsution of a specific transaction.
- Monitor new blocks added to the blockchain and store the energy compsution related to the transactions on it.
- Optimize the number of calls to made to the Blockchain API to avoid asking for the same information multiple times.
- Provide the energy compsution of transactions from a certain wallet adress

## Assumptions 

- You can use a simple model of the BTC network. Every 10 minutes a new block is minted and
  identified by a hash value. Each of the blocks contains all the transactions which are confirmed into
  the network, which can also being individually identify by their own hash value.
- You can use the public Blockchain API from blockchain.com to retrieve information, for example:
  - Latest block: https://blockchain.info/latestblock 
  - Information of a single block: https://blockchain.info/rawblock/$block_hash
  - Information of a single transaction: https://blockchain.info/rawtx/$tx_hash
  - Information on transactions for a specific wallet adress: https://blockchain.info/rawaddr/$bitcoin_address
- Assume that the energy cost per BTC block is 1,173 KwH.
- Assume no distinctions between inputs and outputs in a specific transaction. 
- Feel free to chose whatever type of data storage.

## Project code
This project is comes with a pre-configured GraphQL server, hosted as a serverless
function to get you started on the assignment. However, feel free to write your
own implementation if you prefer.

## Running the project
Requirements:
- NodeJS 14.x (run `nvm use` in root folder)
- Yarn cli
- Serverless framework: run `npm install -g serverless`

Install dependencies:

```sh
yarn
```

Run the serverless function in offline mode:

```sh
yarn start
```

The server will be ready at: `http://localhost:4000/graphql`

