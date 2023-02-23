## Description

Simple app for generating random numbers from range without repetition, and without using builtin random generator.
Using [Nest](https://github.com/nestjs/nest) framework.

## Setup
- copy `.env.dist` to `.env` and change values to your needs. For linear congruent algorithm constants, you can just use the predefined values.
- make sure Redis is running on your machine.
## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Algorithm
- for generating random numbers, I picked the Linear congruent algorithm which is very easy and produces numbers with fairly good distribution.
- we do not want to generate duplicate numbers, so I decided to keep array of numbers that were not yet generated. On every call of the `/` endpoint, a number from randomly generated index in that array is returned.
- I tried storing the list of unused numbers in Redis, but writing and reading the values was taking too long with large ranges and large number of calls. It might be o.k. for some use cases, but I decided to not store the values. 

