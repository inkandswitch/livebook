
import js
import json

def do_math(func,data):
    if len(data) > 0 and (type(data[0]) == int or type(data[0]) == float):
        return func(data)
    else:
        return None

def mean(nums):
    return sum(nums)/len(nums)

class Record:
    def __init__(self, df, i):
        self._df = df
        self._i = i

    def __getattr__(self,attr):
        return self._df[attr][self._i]

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
        c = self.data[self.column]
        return [ c[i] for i in self.idx]

    def to_plot_data(self):
        return { "x": self.sort, "columns": [
            [self.sort] + [ self.data[self.sort][i] for i in self.idx ],
            [self.column] + [ self.data[self.column][i] for i in self.idx ]
        ], "original_type": "series", }

    def describe(self):
        return self.to_df().describe()

    def head(self):
        return self.to_df().describe()

    def value_counts(self):
        values = [self.data[self.column][i] for i in self.idx]
        uniques = list(set(values))
        counts = [ values.count(val) for val in uniques ]
        new_body = { self.column: uniques, "count": counts }
        new_idx = sorted(range(0,len(uniques)),key=lambda i: counts[i],reverse=True)
        return Series(new_body, "count", self.column, new_idx)

    def to_df(self):
        if self.sort == None:
            return DataFrame.__new__(self.data,[self.column],None,self.idx)
        else:
            return DataFrame.__new__(self.data,[self.sort, self.column],self.sort,self.idx)

    def to_js(self):
        d1 = [self.data[self.column][i] for i in self.idx]
        if self.sort == None:
            return { "head":[self.column], "body":{self.column:d1}, "length":len(self) }
        else:
            d2 = [self.data[self.sort][i] for i in self.idx]
            return { "sort": self.sort, "head":[self.sort, self.column], "body":{self.column:d1,self.sort:d2}, "length":len(self) }

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
            #print "Resample key=%s,val=%s,rule=%s"%(key,val,rule)
            if rule == "A": key = key[:4] + "-01-01"
            if rule == "M": key = key[:7] + "-01"
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
    @staticmethod
    def from_data(data):
        return DataFrame.__new__(data["body"],data["head"],None,range(0,data["length"]))

    @staticmethod
    def from_dict(data):
        return DataFrame.__new__(data,data.keys(),None,range(0,len(data[data.keys()[0]])))

    @staticmethod
    def __new__(data,columns,sort,idx):
        d = DataFrame()
        d._data = data
        d._columns = columns
        d._sort = sort
        d._idx = idx
        return d

    @staticmethod
    def from_csv(path,**kargs):
        return read_csv(path)

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

    def groupby(self,by):
        return GroupBy(self,by)

    def to_js(self):
        body = {}
        for c in self._columns:
            body[c] = [self._data[c][i] for i in self._idx]
        return { "head":self._columns, "body":body, "length":len(self._idx), "sort": self._sort }

    def select(self,key,val):
        return self._reindex([i for i in self._idx if self._data[key][i] == val])

    def columns(self):
        return self._columns

    def describe(self):
        math = {
            "count": lambda d,l,n: l,
            "mean":  lambda d,l,n: sum(d)/l if n else None,
            "std":   lambda d,l,n: 1,
            "min":   lambda d,l,n: d[0],
            "25":    lambda d,l,n: d[l / 4],
            "50":    lambda d,l,n: d[l / 2],
            "75":    lambda d,l,n: d[l * 3 / 4],
            "max":   lambda d,l,n: d[l - 1]
        }
        #summary = { "rows": ["count","mean","std","min","25","50","75","max"], "cols": self.columns(), "data": {} }
        funcs = ["count","mean","std","min","25","50","75","max"]
        data = { "_id": funcs }
        columns = ["_id"] + self.columns()
        sort = "_id"
        idx = range(0,len(funcs))
        for c in self.columns():
            d = sorted(self[c]._to_list())
            l = len(d)
            n = (l > 0 and (type(d[0]) == int or type(d[0]) == float))
            data[c] = [ math[f](d,l,n) for f in funcs ]
        return DataFrame.__new__(data, columns, sort, idx)

    def head(self, n=5):
        data = {}
        idx = range(min(len(self), n))
        for col in self.columns():
            data[col] = [ self._data[col][i] for i in idx]

        result = DataFrame.__new__(data, self._columns, self._sort, idx)
        return result

    def record(self, i):
        return Record(self,i)

    def iterrows(self):
        return [ (i, Record(self,i)) for i in range(0,len(self))].__iter__()

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

def read_csv(filename, header=None, names=None):
    # pandas defaults `header` to 0 (row to be treated as a header)
    # if `names` is specified, however, we use that
    if header is None and names is None:
        header = 0

    if header is None and names is not None:
        header = names

    data = json.loads(str(js.globals.parse_raw_data(filename,header,names)))

    return DataFrame.from_data(data)

