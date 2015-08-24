
## this is boilerplate ruby to expose the load and plot functions to the ruby programs

def load name
  `window.ruby_bridge.load`.call(name)
end

def plot data, a, b
  `window.ruby_bridge.plot`.call(data,a,b)
end

