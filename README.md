# Software Developer Application Test

## Live Postman Docs 
https://documenter.getpostman.com/view/788782/S1TYVG5V?version=latest#a65440cc-56bd-4142-b837-69628b587a52

## Backend 
https://vast-reef-55707.herokuapp.com/v1/

## BUILD 
To run locally, type `docker-compose up --build`


Create a API that serves the latest scores of fixtures of matches in a “**Mock Premier League**”

# User Roles

- **Admins** can
  - signup/login
  - manage teams
    - add
    - remove
    - edit
    - view
  - create fixtures
    - add
    - remove
    - edit (move date)
  - Generate unique links for fixtures
- **Users** can
  - signup/login
  - view teams
  - view completed fixtures
  - view pending fixtures
  - robustly search fixtures/teams

# Authentication

Auth for admin actions should be done using bearer token

# Tools/Stack

NodeJs (JavaScript or TypeScript)

# Test

Unit tests are a must

# Bonus

Bonus points for use of `web caching`.

# Submission

1. Code should be hosted on a git repository.
2. The API should be hosted on a live server (e.g. https://heroku.com)
3. Bonus point for using POSTMAN documentation.
4. Seed the db before final submission

# Duration

7 days

# NB:

Please send an email to acknowledge the receipt of this document.