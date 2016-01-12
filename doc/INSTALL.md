## Install

Setup Go Tools:

    $ go get -u github.com/tools/godep
    $ go get github.com/inkandswitch/livebook

Make sure `$GOPATH/bin` is in your path

Now `$GOPATH/src/github.com/inkandswitch/livebook/` is your working project
directory.  Delete any other copies you have to avoid confusion.  If you want
your folder to be somewhere else make a symlink.

    $ ln -s $GOPATH/src/github.com/inkandswitch/livebook/ ~/livebook

Make sure Livebook is installed in $GOHOME

Set your database URL

    $ export DATABASE_URL="sqlite3://db.sql"

Or

    $ export DATABASE_URL="postgres://user@localhost/dbname"

Install needed modules

    $ ./setup

Start the server

    $ forego start
