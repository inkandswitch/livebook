
import json
from copy import copy
from math import pow,sqrt

def do_math(func,data):
    if len(data) > 0 and (type(data[0]) == int or type(data[0]) == float):
        return func(data)
    else:
        return None

def mean(nums):
    return sum(nums)/len(nums)

class IlocIndexer(object):
    def __init__(self,df):
        self._df = df

    def __getitem__(self,i):
        d = self._df
        if type(i) == slice:
            return DataFrame(d,idx=d._idx[i])
        if type(i) == tuple:
            return DataFrame(d,idx=d._idx[i[0]])
        raise IndexError("Iloc Indexer Unsupported Input")

class Record(object):
    def __init__(self, df, i):
        self._df = df
        self._i = i

    def __getattr__(self,attr):
        return self._df[attr][self._i]

class Series(object):
    def __deepcopy__(self,memo):
        return Series(self.data, sort=self.sort, column=self.column, idx=copy(self.idx))

    def __init__(self, data, column=None, sort=None, idx=None, name=None):
        if type(data) == Series:
            self.data = data.data
            self.column = column or data.column
            self.sort = sort or data.sort
            self.idx = idx or data.idx
        elif type(data) == DataFrame:
            if (data._sort == None): raise IndexError("Cannot coerce DataFrame to a Series without an index")
            self.data = data._data
            self.column = data._sort
            self.sort = None
            self.idx = idx or data._idx
        elif type(data) == dict:
            self.data = data
            self.sort = sort
            self.column = column
            self.idx = idx or range(0,len(data[column]))
        elif idx == None:
            self.column = column or name or "series"
            self.data = { self.column: list(data) }
            self.sort = None
            self.idx = range(0,len(data))
        else:
            self.data = data
            self.column = column
            self.sort = sort
            self.idx = idx

    def __str__(self):
        return "Series:\n" + str(self.data) + "\nCol:" + str(self.column) + "\nSort:" + str(self.sort);

    def __getitem__(self,i):
        if type(i) == slice:
            return Series(self, idx=self.idx[i])
        else:
            return self.data[self.column][self.idx[i]]

    def __and__(self,other):
        return Series([ self[i] & other[i] for i in range(0,len(self))])

    def __iter__(self):
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self.idx)

    def __eq__(self,arg): return self.apply(lambda x: x == arg)
    def __ne__(self,arg): return self.apply(lambda x: x <> arg)
    def __le__(self,arg): return self.apply(lambda x: x <= arg)
    def __lt__(self,arg): return self.apply(lambda x: x < arg)
    def __ge__(self,arg): return self.apply(lambda x: x >= arg)
    def __gt__(self,arg): return self.apply(lambda x: x > arg)

    def hist(self,bins=10):
        from matplotlib import pyplot
        l = sorted(self.tolist())
        _min = l[0]
        _max = l[-1]
        step = (_max - _min) / float(bins)
        buckets = [ _min + step * i for i in range(0,bins+1) ]
        # Format buckets to 2 decimal places
        buckets = [float("{0:.2f}".format(b)) for b in buckets]
        hist = [0] * bins
        last_b = 0
        for val in l:
            for b in range(last_b,bins):
                if val <= buckets[b+1]:
                    hist[b] += 1
                    last_b = b
                    break
        data = { "hist": hist, "buckets": buckets[0:-1] }
        pyplot.bar(buckets, hist)

    def isnumeric(self):
        return type(self[0]) in [int,float,long]

    def isnull(self):
        return self.apply(lambda x: x == None)

    def dropna(self):
        new_idx=[ i for i in self.idx if self.data[self.column][i] != None ]
        return Series(self,idx=new_idx)

    def unique(self):
        memo = set()
        new_idx = []
        c = self.data[self.column]
        for i in self.idx:
            if c[i] not in memo:
                new_idx.append(i)
                memo.add(c[i])
        return Series(self, idx=new_idx)

    def sum(self):
        return sum(self.tolist())

    def apply(self,func):
        return Series({ self.column: [ func(d) for d in self ] }, self.column, None, range(0,len(self)))

    def tolist(self):
        c = self.data[self.column]
        return [ c[i] for i in self.idx]

    def to_plot_data(self):
        return { "x": self.sort, "columns": [
            [self.sort] + [ self.data[self.sort][i] for i in self.idx ],
            [self.column] + [ self.data[self.column][i] for i in self.idx ]
        ], "original_type": "series", }

    def to_plot_data_v2(self):
        return {"x": self.sort, "column": self.column, "data": self.data, "list": self.tolist()}

    def describe(self):
        return self.to_frame().describe()

    def head(self,n=5):
        return Series(self, idx=self.idx[0:n])

    def tail(self,n=5):
        return Series(self, idx=self.idx[-n:])

    def get_index(self):
        return Series(self,column=self.sort,idx=self.idx)

    def value_counts(self):
        values = [self.data[self.column][i] for i in self.idx]
        uniques = list(set(values))
        counts = [ values.count(val) for val in uniques ]
        new_body = { self.column: uniques, "count": counts }
        new_idx = sorted(range(0,len(uniques)),key=lambda i: counts[i],reverse=True)
        return Series(new_body, "count", self.column, new_idx)

    def to_frame(self):
        if self.sort == None:
            return DataFrame(self,columns=[self.column])
        else:
            return DataFrame(self,columns=[self.sort, self.column])

    def to_js(self):
        d1 = [self.data[self.column][i] for i in self.idx]
        if self.sort == None:
            return { "head":[self.column], "body":{self.column:d1}, "length":len(self) }
        else:
            d2 = [self.data[self.sort][i] for i in self.idx]
            return { "sort": self.sort, "head":[self.sort, self.column], "body":{self.column:d1,self.sort:d2}, "length":len(self) }

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
            if rule == "AS": key = key[:4] + "-12-31"
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

class DataFrame(object):
    def __deepcopy__(self,memo):
         return DataFrame(data=self._data, columns=copy(self._columns), sort=copy(self._sort), idx=copy(self._idx))

    def __init__(self, base=None, data=None, columns=None, sort=None, idx=None):
        self.iloc = IlocIndexer(self)
        if type(base) == Series:
            self._data = base.data
            self._columns = [base.sort, base.column] if base.sort else [base.column]
            self._sort = base.sort
            self._idx = base.idx
        elif type(base) == dict:
            self._data = base
            self._columns = columns or base.keys()
            self._sort = sort or None
            self._idx = idx or range(0,len(self._data[self._columns[0]]))
        elif type(base) == DataFrame:
            self._data = data or base._data
            self._columns = columns or base._columns
            self._sort = sort or base._sort
            self._idx = idx or base._idx
        else:
            self._data = data
            self._columns = columns
            self._sort = sort
            self._idx = idx
            pass
        self.__postinit__()

    @staticmethod
    def from_data(data):
        return DataFrame(data["body"],columns=data["head"])

    @staticmethod
    def from_dict(data):
        return DataFrame(data)

    @staticmethod
    def from_csv(path,**kargs):
        return read_csv(path)

    def __str__(self):
        return "DataFrame:\n" + str(self._data)

    def __postinit__(self):
        self.shape = (len(self),len(self._columns))
        self.columns = self._columns
        if (self._sort):
            self.index = self[self._sort]
        else:
            self.index = Series(range(0,len(self)))

    def __setitem__(self,key,val):
        ## FIXME - this mutates the structure
        if len(val) != len(self):
            raise TypeError("__setitem__ called with an assignment of the wrong length")
        try:
            val2 = list(val) ## TODO - make a reverse index?
            remapped = len(self)*[None]
            for i in range(0,len(self)):
                remapped[self._idx[i]] = val2[i]
            self._data[key] = remapped
            self._columns.index(key)
        except ValueError:
            self._columns.append(key)

    def __getitem__(self,i):
#        if type(i) == str and i == "_data":
#            raise ValueError("NOPE")
        if (type(i) is str or type(i) is unicode):
            return Series(self._data,i,self._sort,self._idx)
        elif (type(i) is Series):
            return DataFrame(self, idx=[ self._idx[n] for n in range(0,len(self)) if i[n] ])
        elif (i < 0 or i >= len(self)):
            raise IndexError("DataFrame index out of range")
        else:
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
        for h in self.columns: body[h] = []
        return body

    def insert(self,loc,column,val): ## FIXME - this is the only function we have that mutates - could effect older objects
        self._columns.insert(loc,column)
        self._data[column] = [ val for i in range(0,len(self)) ]
        self.shape = (len(self),len(self._columns))

    def apply(self,func):
        new_data = {}
        for c in self._columns:
            new_data[c] = [ func(d) for d in self._data[c] ]
        return DataFrame(self, data=new_data)

    def set_index(self,index):
        return DataFrame(self, sort=index)

    def dropna(self,**kwargs):
        new_idx = [i for i in self._idx if all([self._data[c][i] != None for c in self.columns])]
        if kwargs is not None:
            if "inplace" in kwargs and kwargs["inplace"] == True:
                self._idx = new_idx
                return self
        return DataFrame(self, idx=new_idx)

    def sort_values(self,by,ascending=True):
        new_idx = sorted(self._idx,key=lambda i: self._data[by][i],reverse=(not ascending))
        return DataFrame(self, idx=new_idx)

    def groupby(self,by):
        return GroupBy(self,by)

    def to_js(self):
        body = {}
        for c in self._columns:
            body[c] = [self._data[c][i] for i in self._idx]
        return { "head":self._columns, "body":body, "length":len(self._idx), "sort": self._sort }

    def describe(self):
        funcs = ["count","mean","std","min","25","50","75","max"]
        data = { "_id": funcs }
        columns = [ c for c in self.columns if self[c].isnumeric() ]
        sort = "_id"
        idx = range(0,len(funcs))
        for c in columns:
            d    = sorted(self[c].dropna().tolist())
            l    = len(d)
            mean = sum(d)/l
            std  = sqrt(sum([ pow(mean - val, 2) for val in d ])/(l-1))
            _min = d[0]
            _25  = d[l/4]
            _50  = d[l/2]
            _75  = d[l*3/4]
            _max = d[l-1]
            data[c] = [ l, mean, std, _min, _25, _50, _75, _max ]
        return DataFrame(data, columns=["_id"] + columns, sort=sort, idx=idx)

    def head(self, n=5):
        return DataFrame(self, idx=self._idx[0:n])

    def tail(self, n=5):
        return DataFrame(self, idx=self._idx[-n:])

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

class Cache:
    csv = {}

def read_csv(filename, header=None, names=None):
    import js
    # pandas defaults `header` to 0 (row to be treated as a header)
    # if `names` is specified, however, we use that
    if header is None and names is None:
        header = 0

    if header is None and names is not None:
        header = names

    key = str([filename,header,names])

    if key in Cache.csv:
        return DataFrame.from_data(Cache.csv[key])

    Cache.csv[key] = json.loads(str(js.globals.parse_raw_data(filename,header,names)))

    return DataFrame.from_data(Cache.csv[key])

