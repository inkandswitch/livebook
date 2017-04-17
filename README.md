# Livebook

Livebook is an [IPython notebook](http://ipython.org/notebook.html)-compatible experiment to share your data stories on the web. It features live coding, realtime collaboration, a WYSIWYG prose editor, and runs 100% in the browser.

![screenshot](https://raw.githubusercontent.com/inkandswitch/livebook/master/doc/livebook_screenshot.png "livebook")

- [Livebook](#livebook)
- [Motivation and audience](#motivation-and-audience)
- [Features](#features)
- [Setup](#setup)
  - [Try it](#try-it)
  - [Install or develop it](#install-or-develop-it)
- [Caveats](#caveats)
- [Technologies](#technologies)
- [Meta](#meta)

## Motivation and audience

We data scientists tell stories with data. This is why the notebook format is so powerful: a mix of explanatory prose, data, and executable code that produces charts and tables.

When we share our notebook with a client, researcher, or other colleague who is not a heavy IPython/Jupyter user, we typically send them static HTML or a PDF. But this doesn't invite them into the story, because they cannot freely tinker with the results without setting up their own Python environment.

By uploading a notebook to Livebook, you can share it in a format that allows them to play with the code or edit the prose without installing anything. When your colleagues can interact with your data stories, your narrative becomes bidirectional.

_Livebook is an experiment, not for production use. We hope it will demonstrate some ideas and perhaps inform future possibilities for the Jupyter project._ 

## Features

### Live coding

Play around with your code and plots, and get instant results as you type. No need to rerun cells or track cell dependencies.

### Realtime collaboration

Work on your notebooks simultaneously and see your collaborators' edits on the fly.

### WYSIWYG prose editor
Structure and document your notebooks as if you were writing a regular text file, including easy formatting and highlighting. Your colleagues don't need to know Markdown to contribute to the notebook.

## Setup

### Try it

[http://livebook.inkandswitch.com/](http://livebook.inkandswitch.com/)

### Install or develop it

Livebook is open source and can be run locally, run on a server, or deployed to Heroku. Instructions are in [`doc/INSTALL.md`](https://github.com/inkandswitch/livebook/blob/master/doc/INSTALL.md).

## Caveats

- developed on Chrome; functionality may be incomplete on other browsers
- currently not supporting full pandas, but a stand-in “fauxpandas” library
- matplotlib shim very incomplete
- no ability to use wider ecosystem of python tools
- can’t use print statements
- CSV file cannot be changed after initial upload
- size of embedded CSV file limited to a few thousand records

## Technologies

- Web front-end: [React](http://reactjs.net/), [Webpack](https://webpack.github.io/)
- Runtime: [Pypyjs](http://pypyjs.org/)
- Editing: [Ace](https://ace.c9.io), [Medium-editor](https://yabwe.github.io/medium-editor/)
- Charts: [C3](http://c3js.org/)/[D3](http://d3js.org/)
- P2P networking: [WebRTC](https://webrtc.org/)

## Meta

Released under the [MIT license](https://opensource.org/licenses/MIT).

Big thanks to the wonderful folks in the IPython/Jupyter community, the authors of all the technologies listed above, and [John Templon](https://twitter.com/jtemplon), [Justin Bozonier](https://twitter.com/databozo), and [Randal Olson](http://www.randalolson.com/) for the sample notebooks.

Made with <3 by [Adam Wiggins](https://twitter.com/hirodusk), Orion Henry, [Brett Beutell](http://brettim.us/), and [Lucía Santamaría](https://about.me/lusantala).
