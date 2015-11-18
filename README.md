# Livebook, an iPython notebook-compatible live coding experiment

## Install

Setup Go Tools:

    $ go get -u github.com/tools/godep
    $ go get github.com/aordlab/livebook
    $ ln -s $GOPATH/src/github.com/aordlab/livebook/ DESIRED_PROJECT_DIR

Make sure Livebook is installed in $GOHOME

Set your database URL

    $ export DATABASE_URL="sqlite3://db.sql"

Or

    $ export DATABASE_URL="postgres://user@localhost/dbname"

Install needed modules

    $ ./setup

Build the go binary

    $ make

Start the server

    $ npm start
