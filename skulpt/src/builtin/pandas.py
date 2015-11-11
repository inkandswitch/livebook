
#class Series:
#    def __init__(self,data,**kwargs):
#        self.data = data
#        if kwargs["index"]:
#            self.index = kwargs["index"]
#
#    def __getitem__(self,i):
#        return self.data[i]

class DataCore:
    def __init__(self,data):
        self.__data__ = data

    def head(self):
        return self.__data__["head"]

    def body(self):
        return self.__data__["body"]

    def indexes(self):
        return self.__data__["indexes"]

    def __len__(self):
        return self.__data__["length"]


class DataFrame:

    def __init__(self,data):
        self.__core__ = DataCore(data)
#        self.head   = data["head"]
#        self.body   = data["body"]
#        self.length = data["length"]
#        self.index  = None

    def __getitem__(self,i):
        if (type(i) is str):
            return self.__core__.body()[i]
        if (i < 0 or i >= len(self)):
            raise IndexError("DataFrame index out of range")
        data = []
        for h in self.columns():
            data.append(self[h][i]) 
        return tuple(data)

    def __getattr__(self,attr):
        return self[attr]

    def __iter__(self):
        for i in range(0, len(self.__core__)):
            yield self.__getitem__(i)

    def __len__(self):
        return len(self.__core__)

    def __blank_body__(self): ## TODO - need a simpler one here
        body = {}
        for h in self.columns():
            body[h] = []
        return body

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
            result = DataFrame({"head":result.columns(),"body":new_body,"length":new_len}) ## TODO use core
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
        return DataFrame(selection)

    def columns(self):
        return self.__core__.head()

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
    return DataFrame(__load_data__(name))

