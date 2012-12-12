test:
    @NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter dot --ignore-leaks --timeout 3000
