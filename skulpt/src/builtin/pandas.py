
def mean(nums):
    return sum(nums)/len(nums)

class DataCore:
    def __init__(self,head,body,index,idx):
        self.head = head
        self.body = body
        self.index = index
        self.idx = idx

    def set_index(self,index,idx):
        return DataCore(self.head,self.body,index,idx)

    def __len__(self):
        return len(self.idx)


class Series:
    def __init__(self, core, column ):
        self.core = core
        self.column = column

    def __getitem__(self,i):
        return self.core.body[self.column][self.core.idx[i]]

    def __iter__(self):
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self.core)

    def _to_list(self):
        l = []
        for i in self:
            l.append(i)
        return l

    def flip(self):
        return Series(DataCore(self.core.head, self.core.body, self.column, self.core.idx), self.core.index)

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
        print new_body
        return Series(DataCore(new_head,new_body,self.column,range(0,len(new_body[how]))), how)

        print bins

    def iteritems(self):
        ## todo : error if no index
        return [ ( self.flip()[i], self[i] ) for i in range(0,len(self))].__iter__()
#        return [ ( self.core.body[self.core.index][self.core.idx[i]], self[i] ) for i in range(0,len(self))].__iter__()



class DataFrame:

    def from_data(data):
        d = DataFrame()
        d.__core__ = DataCore(data["head"],data["body"],[],range(0,data["length"]))
        return d

    def from_core(core):
        d = DataFrame()
        d.__core__ = core
        return d

    def __getitem__(self,i):
        if (type(i) is str):
            return Series(self.__core__,i)
        if (i < 0 or i >= len(self)):
            raise IndexError("DataFrame index out of range")
        data = []
        for h in self.columns():
            data.append(self[h][i])
        return tuple(data)

    def __getattr__(self,attr):
        return self[attr]

    def __iter__(self):
        for i in range(0, len(self)):
            yield self[i]

    def __len__(self):
        return len(self.__core__)

    def __blank_body__(self): ## TODO - need a simpler one here
        body = {}
        for h in self.columns():
            body[h] = []
        return body

    def set_index(self,index):
        seq = self[index]
        idx = sorted(range(0,len(seq)),key=lambda i: seq[i])
        print "set index: %s" % index
        print idx
        return DataFrame.from_core(self.__core__.set_index(index,idx))

    def dropna(self,**kargs):
        result = self
        for key in kargs:
            val = kargs[key]
            if key == "subset":
                new_len  = 0
                new_body = result.__blank_body__()
            for i in range(0,len(result)):
                if all([result[h][i] != None for h in val]):
                    new_len += 1
                    for h in result.columns():  ## TODO - need an external method for this
                        new_body[h].append(result[h][i])
            result = DataFrame.from_data({"head":result.columns(),"body":new_body,"length":new_len}) ## TODO use core
        return result

    def from_csv(path,**kargs):
        return read_csv(path)

    def groupby(self,by):
        return GroupBy(self,by)

    def to_js(self):
        return { "head":self.head, "body":self.body, "length":len(self) }

    def select(self,key,val):
        selection = { "head": self.columns(), "body": {}, "length": 0 }
        for h in self.head:
            selection["body"][h] = []
        for i, d in enumerate(self[key]):
            if d == val:
                selection["length"] += 1
                for h in self.head:
                    # print "ADD h=%s i=%s d=%s val=%s --=%s" % (h,i,d,val,self.body[h][i])
                    selection["body"][h].append(self[h][i])
        return DataFrame.from_data(selection)

    def columns(self):
        return self.__core__.head

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

