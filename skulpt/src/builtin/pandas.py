
class DataFrame:
    def __init__(self,data):
        ## we will have problems here if there is a column named head,body,length :(
        self.head   = data["head"]
        self.body   = data["body"]
        self.length = data["length"]
        for h in self.head:
            setattr(self, h, self.body[h])

    def __getitem__(self,i):
        if (i < 0 or i >= self.length):
            raise IndexError("DataFrame index out of range")
        data = []
        for h in self.head:
            data.append(self.body[h][i])
        return tuple(data)

    def __iter__(self):
        for i in range(0, self.length):
            yield self.__getitem__(i)

    def __len__(self):
        return self.length

    def groupby(self,by):
        return GroupBy(self,by)

    def to_js(self):
        return { "head":self.head, "body":self.body, "length":self.length }

    def select(self,key,val):
        selection = { "head": self.head, "body": {}, "length": 0 }
        for h in self.head:
            selection["body"][h] = []
        for i, d in enumerate(self.body[key]):
            if d == val:
                selection["length"] += 1
                for h in self.head:
                    # print "ADD h=%s i=%s d=%s val=%s --=%s" % (h,i,d,val,self.body[h][i])
                    selection["body"][h].append(self.body[h][i])
        return DataFrame(selection)

    def columns(self):
        return self.head

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
        summary = { "rows": ["count","mean","std","min","25","50","75","max"], "cols": self.head, "data": {} }
        for func in summary["rows"]:
            summary["data"][func] = {}
            for h in summary["cols"]:
                summary["data"][func][h] = math[func](self.body[h])
        return summary

class GroupBy:
    def __init__(self, data, by):
        self.groups = {}
        for i in range(0, data.length):
            v = data.body[by][i]
            if not v in self.groups:
                self.groups[v] = data.select(by,v)

    def __iter__(self):
        for k in self.groups:
            yield (k,self.groups[k])

def read_csv(name):
    return DataFrame(__load_data__(name))

