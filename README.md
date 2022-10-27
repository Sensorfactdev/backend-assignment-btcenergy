# Backend Engineer Technical Assignment
## Introduction
This assessment aims to assess the technical, analytical, and collaboration skills of
the candidates for backend development positions in Sensorfact.

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
  offers us during development, reviews, and testing.

## Process & Guidelines

>- **We aim to timebox the assignment to 4 hours**, but feel free to dedicate as much time as you consider necessary
>- Make a conscious decision on what you want to focus on: it's ok if you
   cannot complete the entire assignment.
>- Send us your solution before the technical interview: link to a repository.
   You can, for example, fork this repository.
>- The assignment includes a description of a problem to solve, which could potentially lack
   details. Feel free to make assumptions if needed, or contact us for clarification if you consider it necessary.
>- Take this assignment as an opportunity to show us your style: what you like to
   work on, what you find important, how you address problems,etc.
>- **During the technical interview, we invite you to present your solution and discuss
   it together as a team**: which decisions you took and why, questions about specific parts of the code,
   libraries you have used, how easy and maintainable is the code,etc.

## Problem to solve (an imaginary one, of course ;))

Sustainability is starting to take a key role in every product or solution launched into the market, and software
systems are not an exception. It is not enough anymore to create and deploy in time complex and innovative
systems which bring value to customers; they also need to be efficient. They need to
be sustainable and consume the minimum amount of resources in their operations.

As you probably have heard, one of the principal arguments against using Bitcoin is the amount of energy needed to keep
the system running. To evaluate the sustainability of the blockchain network in which Bitcoin runs, we
want to create a platform to monitor the energy spent on financial transactions using Bitcoin.

The platform will visualize the energy consumed by the network and potentially calculate energy waste. Our frontend
development team will need an API (preferably GraphQL) to connect to which will provide this information. The platform should
be able to perform the following operations (already sorted by priority):

- Provide the energy consumption per transaction for a specific block.
- Provide the total energy consumption per day in the last `x` number of days.
- Advanced Feature: Optimize the number of calls made to the Blockchain API to avoid asking for the
  same information multiple times.
- Expert Feature: Provide the total energy consumption of all transactions performed by a specific wallet address.

Even if it is too soon in the product's lifetime to think about non-functional requirements, it will be beneficial to
build it considering that we hope to scale the solution and avoid significant refactoring.

## Assumptions

**- You can use a simple model of the BTC network: the network is composed of blocks (each block identified by a unique `hash` value
or a block index). Each block contains a set of transactions, each transaction also has a unique `hash` by which it can be identified.**
- Every transaction takes up a variable amount of storage space inside the block, indicated by the `size` field (in bytes).
- Assume that the energy cost per byte is 4,56 KwH.
- You can use the public Blockchain API from blockchain.com to retrieve information
  (https://www.blockchain.com/explorer/api/blockchain_api), for example:
    - Latest block: https://blockchain.info/latestblock
    - Information of blocks in a day: https://blockchain.info/blocks/$time_in_milliseconds?format=json
    - Information of a single block: https://blockchain.info/rawblock/$block_hash
    - Information of a single transaction: https://blockchain.info/rawtx/$tx_hash
    - Information on transactions for a specific wallet address: https://blockchain.info/rawaddr/$bitcoin_address

## Project code
This project is comes with a pre-configured GraphQL server, hosted as a serverless
function to get you started on the assignment. However, feel free to write your
own implementation if you prefer.

## Running the project
Requirements:
- NodeJS 16.x (run `nvm use` in root folder)
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

