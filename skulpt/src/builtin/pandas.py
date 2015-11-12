
def mean(nums):
    return sum(nums)/len(nums)

class Series:
    def __init__(self, data, column, sort, idx):
        self.data = data
        self.column = column
        self.sort = sort
        self.idx = idx

    def __getitem__(self,i):
        return self.data[self.column][self.idx[i]]

    def __iter__(self):
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self.idx)

    def _to_list(self):
        l = []
        for i in self:
            l.append(i)
        return l

    def index(self):
        return Series(self.data, self.sort, None, self.idx)

    def resample(self,rule,**kwargs):
        keys = []
        bins = {}
        how = "mean"
        _how = mean
        if "how" in kwargs:
            how = kwargs["how"]
            _how = len ## todo
        for key,val in self.iteritems():
            if key in bins:
                bins[key].append(val)
            else:
                keys.append(key)
                bins[key] = [val]
        new_body = { self.column: [], how: [] }
        new_head = [ self.column, how ]
        for k in keys:
            new_body[self.column].append(k)
            new_body[how].append(_how(bins[k]))
        return Series(new_body, how, self.column, range(0,len(new_body[how])))

    def iteritems(self):
        return [ ( self.data[self.sort][i], self.data[self.column][i] ) for i in self.idx].__iter__()

class DataFrame:
    def from_data(data):
        return DataFrame.__new__(data["body"],data["head"],None,range(0,data["length"]))

    def __new__(data,columns,sort,idx):
        d = DataFrame()
        d._data = data
        d._columns = columns
        d._sort = sort
        d._idx = idx
        return d

    def __getitem__(self,i):
        if (type(i) is str):
            return Series(self._data,i,self._sort,self._idx)
        if (i < 0 or i >= len(self)):
            raise IndexError("DataFrame index out of range")
        return tuple(map(lambda x: self._data[x][self._idx[i]], self._columns))

    def __getattr__(self,attr):
        return self[attr]

    def __iter__(self):
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self._idx)

    def __blank_body__(self): ## TODO - need a simpler one here
        body = {}
        for h in self.columns(): body[h] = []
        return body

    def _reindex(self, new_idx, **kwargs):
        new_sort = kwargs["sort"] if ('sort' in kwargs) else self._sort
        return DataFrame.__new__(self._data, self._columns, new_sort, new_idx)

    def set_index(self,index):
        new_idx = sorted(self._idx,key=lambda i: self._data[index][i])
        return self._reindex(new_idx,sort=index)

    def dropna(self,**kargs):
        new_idx = self._idx
        for key in kargs:
            cols = kargs[key]
            if key == "subset":
                new_idx = [x for x in new_idx if all([self._data[c][x] != None for c in cols])]
        return self._reindex(new_idx)

    def from_csv(path,**kargs):
        return read_csv(path)

    def groupby(self,by):
        return GroupBy(self,by)

    def to_js(self):
        return { "head":self.head, "body":self.body, "length":len(self) }

    def select(self,key,val):
        return self._reindex([i for i in self._idx if self._data[key][i] == val])

    def columns(self):
        return self._columns

    def describe(self):
        math = {
            "count": lambda x: len(x),
            "mean":  lambda x: sum(x) / len(x),
            "std":   lambda x: 0,
            "min":   lambda x: min(x),
            "25":    lambda x: sorted(x)[len(x) / 4],
            "50":    lambda x: sorted(x)[len(x) / 2],
            "75":    lambda x: sorted(x)[len(x) * 3 / 4],
            "max":   lambda x: max(x),
        }
        summary = { "rows": ["count","mean","std","min","25","50","75","max"], "cols": self.columns(), "data": {} }
        for func in summary["rows"]:
            summary["data"][func] = {}
            for h in summary["cols"]:
                summary["data"][func][h] = math[func](self.body[h])
        return summary

class GroupBy:
    def __init__(self, data, by):
        self.groups = {}
        for i in range(0, len(data)):
            v = data.body[by][i]
            if not v in self.groups:
                self.groups[v] = data.select(by,v)

    def __iter__(self):
        for k in self.groups:
            yield (k,self.groups[k])

def read_csv(name):
    return DataFrame.from_data(__load_data__(name))

