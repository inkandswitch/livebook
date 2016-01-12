#Livebook

<img src="https://raw.githubusercontent.com/inkandswitch/livebook/master/doc/livebook.png?token=AEQz9axtqjO4ZglgrBuook6n-PwD-YbWks5WnmATwA%3D%3D" align="right" width="400px" />

An [IPython notebook](http://ipython.org/notebook.html)-compatible experiment to share your data stories in the browser.

Livebook features live coding, realtime collaboration, a WYSIWYG prose editor, and runs 100% in browser.

- [Livebook](#livebook)
- [Motivation and audience](#motivation-and-audience)
- [Features](#features)
- [Setup](#setup)
  - [Try it](#try-it)
  - [Install or develop it](#install-or-develop-it)
- [Caveats](#caveats)
- [Technologies](#technologies)
- [Meta](#meta)

##Motivation and audience

We data scientists tell stories with data. This is why the notebook format is so powerful: a mix of explanatory prose, data, and executable code that produces charts and tables.

When we share our notebook with a client, researcher, or other colleague who is not a heavy IPython/Jupyter user, we typically send them static HTML or a PDF. But this doesn't invite them into the story, because they cannot freely tinker with the results without setting up their own Python environment.

By uploading a notebook to Livebook, you can share it with a colleague in a format that allows them to edit the prose and even the code to see the results. It runs completely in-browser, so they have nothing to install. When your colleagues can interact with your data stories, your narrative becomes bidirectional.

_Livebook is not for production use. It's an experiment, intended to demonstrate some ideas and perhaps inform future possibilities for the Jupyter project._ 

##Features

###Live coding

Play around with your code and plots, and get instant results as you type. No need to rerun cells or track cell dependencies.

<img src="https://raw.githubusercontent.com/inkandswitch/livebook/master/doc/live-coding.png?token=AEQz9WYkRBFg2qrk9kkddaJ-8nIZvKfvks5WnmCfwA%3D%3D" align="left" width="800px" />

###Realtime collaboration

Work on your notebooks simultaneously and see your collaborators’ edits on the fly.

###WYSIWYG prose editor
Structure and document your notebooks as if you were writing a regular text file, including easy formatting and highlighting. Your colleagues don’t need to know Markdown to contribute to the notebook.

<img src="https://raw.githubusercontent.com/inkandswitch/livebook/master/doc/prose-editor.png?token=AEQz9QqiSOYSdfXtqAyXGqX7bQfThOiUks5WnmDIwA%3D%3D" align="left" width="600px" />

##Setup

###Try it

Visit [livebook.example.com](livebook.example.com) to fork a welcome notebook and get started. And try the other sample notebooks: Earthquakes and Monte Carlo.

###Install or develop it

Livebook is open source and can be run locally, run on a server, or deployed to Heroku. Instructions are in INSTALL.md.

##Caveats

- currently not supporting full pandas, but a stand-in “fauxpandas” library
- matplotlib shim very incomplete
- no ability to use wider ecosystem of python tools
- can’t use print statements
- CSV file cannot be changed after initial upload
- size of embedded CSV file limited to a few thousand records

##Technologies

- Web front-end: [React](http://reactjs.net/), [Webpack](https://webpack.github.io/)
- Runtime: [Pypyjs](http://pypyjs.org/)
- Editing: [Ace](https://ace.c9.io), [Medium-editor](https://yabwe.github.io/medium-editor/)
- Charts: [C3](http://c3js.org/)/[D3](http://d3js.org/)
- P2P networking: [WebRTC](https://webrtc.org/)

##Meta

Released under the [MIT license](https://opensource.org/licenses/MIT).

Big thanks to the wonderful folks in the IPython/Jupyter community, the authors of all the technologies listed above, and [John Templon](https://twitter.com/jtemplon) and [Justin Bozonier](https://twitter.com/databozo) for the sample notebooks.

Made with <3 by [Adam Wiggins](https://twitter.com/hirodusk), Orion Henry, [Brett Beutell](http://brettim.us/), and [Lucía Santamaría](https://about.me/lusantala).
