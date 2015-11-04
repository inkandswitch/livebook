
class DataFrame:
  def __init__(self,data):
    self.data = data

  def __iter__(self):
    return

  def __len__(self):
    return

  def groupby(self):
    return

  def to_js(self):
    return self.data

  def select(self):
    return

  def columns(self):
    return self.head

  def describe(self):
    return

class GroupBy:
  def __init__(self):
    return

  def __iter__(self):
    return

def read_csv(name):
  return DataFrame(__load_data__(name))
